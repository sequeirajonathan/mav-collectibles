"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useUser, useReverification } from "@clerk/nextjs";
import { useSearchSquareCustomer } from '@hooks/useSearchSquareCustomer';
import { useUpdateSquareCustomer } from '@hooks/useUpdateSquareCustomer';
import { toast } from 'react-hot-toast';
import { SquareCustomer, SquareCustomerAddress, UpdateSquareCustomerData } from '@interfaces/square';
import { AddressSelectionDialog } from "@components/ui/AddressSelectionDialog";
import { Copy } from 'lucide-react';

interface CustomerFormData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  address: string;
  city: string;
  zipCode: string;
}

interface AddressSuggestionResponse {
  status: 'address_suggestion';
  originalAddress: SquareCustomerAddress;
  suggestedAddress: SquareCustomerAddress;
  messages: Array<{
    code: string;
    source: string;
    text: string;
    type: string;
  }>;
}

type CustomerUpdateResponse = SquareCustomer | AddressSuggestionResponse;

export default function ProfilePage() {
  const { user } = useUser();
  const phoneNumber = user?.phoneNumbers?.[0]?.phoneNumber?.replace(/\D/g, '').slice(-10);
  const { customer } = useSearchSquareCustomer(phoneNumber);
  const { updateCustomer, isUpdating } = useUpdateSquareCustomer();
  const [formData, setFormData] = useState<CustomerFormData>({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    address: "",
    city: "",
    zipCode: "",
  });
  const [originalFormData, setOriginalFormData] = useState<CustomerFormData | null>(null);
  const [referenceId, setReferenceId] = useState<string | undefined>(undefined);
  const [addressSuggestion, setAddressSuggestion] = useState<AddressSuggestionResponse | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const updatePhoneNumber = useReverification(async (newPhone: string) => {
    await user?.createPhoneNumber({ phoneNumber: newPhone });
  });

  useEffect(() => {
    if (customer) {
      console.log('Square Customer Phone:', customer.phoneNumber);
      console.log('Clerk User Phone:', user?.phoneNumbers?.[0]?.phoneNumber);
      console.log('Square Customer ReferenceId:', customer.referenceId);
      const loadedData = {
        firstName: customer.givenName || "",
        lastName: customer.familyName || "",
        email: customer.emailAddress || "",
        phoneNumber: customer.phoneNumber || "",
        address: customer.address?.addressLine1 || "",
        city: customer.address?.locality || "",
        zipCode: customer.address?.postalCode || "",
      };
      setFormData(prev => ({ ...prev, ...loadedData }));
      setOriginalFormData(loadedData);
      setReferenceId(customer.referenceId);
    }
  }, [customer, user]);

  // Ensure Square customer has referenceId set to Clerk user ID
  useEffect(() => {
    if (
      user?.id &&
      customer?.id &&
      customer.referenceId !== user.id && // Only if referenceId is missing or different
      customer.referenceId !== undefined // Only if referenceId is not undefined
    ) {
      const updatePayload: UpdateSquareCustomerData = {
        customerId: customer.id,
        referenceId: user.id,
      };
      if (customer.givenName) {
        updatePayload.givenName = customer.givenName;
      } else if (customer.emailAddress) {
        updatePayload.emailAddress = customer.emailAddress;
      } else if (customer.familyName) {
        updatePayload.familyName = customer.familyName;
      }
      console.log('[Square RefID Update] Sending payload:', updatePayload);
      updateCustomer(updatePayload)
        .then((response) => {
          console.log('[Square RefID Update] Response:', response);
          // Optionally, you could refetch customer data here if needed
          console.log('Added Clerk user ID as referenceId to Square customer');
        })
        .catch((err) => {
          console.error('[Square RefID Update] Failed to update Square customer referenceId:', err);
        });
    }
  }, [
    user?.id,
    customer?.id,
    customer?.referenceId,
    updateCustomer,
    customer?.givenName,
    customer?.familyName,
    customer?.emailAddress,
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer) return;

    try {
      // Format phone number to exactly 10 digits, removing country code
      const digitsOnly = formData.phoneNumber.replace(/\D/g, '');
      const formattedPhone = digitsOnly.startsWith('1') ? digitsOnly.slice(1) : digitsOnly;
      
      console.log('Form Phone Number:', formData.phoneNumber);
      console.log('Digits Only:', digitsOnly);
      console.log('Formatted Phone:', formattedPhone);
      
      if (formattedPhone.length !== 10) {
        toast.error('Phone number must be 10 digits');
        return;
      }

      // Update Clerk phone number if it has changed
      const currentClerkPhone = user?.phoneNumbers?.[0]?.phoneNumber;
      const newClerkPhone = `+1${formattedPhone}`;
      
      if (currentClerkPhone !== newClerkPhone) {
        try {
          await updatePhoneNumber(newClerkPhone);
          console.log('Clerk phone number updated successfully');
        } catch (error) {
          console.error('Error updating Clerk phone number:', error);
          toast.error('Failed to update phone number in account');
          return;
        }
      }

      // Update Square customer using the hook
      const updateData = {
        customerId: customer.id,
        emailAddress: formData.email,
        givenName: formData.firstName,
        familyName: formData.lastName,
        phoneNumber: `+1${formattedPhone}`,
        address: {
          country: "US",
          firstName: formData.firstName,
          lastName: formData.lastName,
          addressLine1: formData.address,
          locality: formData.city,
          postalCode: formData.zipCode,
          administrativeDistrictLevel1: "FL", // Required by Square
        },
      };

      const response = await updateCustomer(updateData) as CustomerUpdateResponse;

      if ('status' in response && response.status === 'address_suggestion') {
        setAddressSuggestion(response as AddressSuggestionResponse);
        setIsDialogOpen(true);
      } else {
        toast.success("Profile updated successfully");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("An error occurred while updating your profile");
    }
  };

  const handleAddressSelection = async (address: SquareCustomerAddress) => {
    if (!customer) return;

    try {
      const updateData = {
        customerId: customer.id,
        givenName: formData.firstName,
        familyName: formData.lastName,
        emailAddress: formData.email,
        phoneNumber: `+1${formData.phoneNumber.replace(/\D/g, '').slice(-10)}`,
        address,
      };

      const response = await updateCustomer(updateData) as CustomerUpdateResponse;

      if ('status' in response && response.status === 'address_suggestion') {
        setAddressSuggestion(response);
      } else {
        setIsDialogOpen(false);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const [parent, child] = name.split(".");

    if (child) {
      if (parent === 'address') {
        setFormData(prev => ({
          ...prev,
          address: value
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Compare form data to original
  const isFormUnchanged = !originalFormData || Object.keys(formData).every(
    (key) => formData[key as keyof CustomerFormData] === originalFormData[key as keyof CustomerFormData]
  );

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-[#E6B325] flex items-center justify-center">
        <p className="text-lg">Please sign in to view your profile.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-[#E6B325] py-12">
      <div className="max-w-4xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-black/50 backdrop-blur-sm border border-[#E6B325]/30 rounded-lg p-8"
        >
          <h1 className="text-3xl font-bold mb-8 text-center">Edit Profile</h1>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">First Name</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-md bg-black border border-[#E6B325]/30 text-[#E6B325] focus:border-[#E6B325] focus:ring-0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-md bg-black border border-[#E6B325]/30 text-[#E6B325] focus:border-[#E6B325] focus:ring-0"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-4 py-2 rounded-md bg-black border border-[#E6B325]/30 text-[#E6B325] focus:border-[#E6B325] focus:ring-0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Phone Number</label>
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                className="w-full px-4 py-2 rounded-md bg-black border border-[#E6B325]/30 text-[#E6B325] focus:border-[#E6B325] focus:ring-0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Reference ID</label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  name="referenceId"
                  value={referenceId || ''}
                  readOnly
                  className="w-full px-4 py-2 rounded-md bg-black border border-[#E6B325]/30 text-[#E6B325] opacity-60 focus:border-[#E6B325] focus:ring-0 select-all pr-10"
                  style={{ cursor: 'default' }}
                  tabIndex={-1}
                  aria-readonly="true"
                />
                {referenceId && (
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[#E6B325] hover:text-white focus:outline-none"
                    aria-label="Copy Reference ID"
                    onClick={() => {
                      navigator.clipboard.writeText(referenceId);
                    }}
                  >
                    <Copy size={18} />
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Address</h2>
              <div>
                <label className="block text-sm font-medium mb-2">Street Address</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-md bg-black border border-[#E6B325]/30 text-[#E6B325] focus:border-[#E6B325] focus:ring-0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">City</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-md bg-black border border-[#E6B325]/30 text-[#E6B325] focus:border-[#E6B325] focus:ring-0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">ZIP Code</label>
                <input
                  type="text"
                  name="zipCode"
                  value={formData.zipCode}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-md bg-black border border-[#E6B325]/30 text-[#E6B325] focus:border-[#E6B325] focus:ring-0"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="px-6 py-2 bg-[#E6B325] text-black font-medium rounded-md hover:bg-[#E6B325]/90 focus:outline-none focus:ring-2 focus:ring-[#E6B325] focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isUpdating || isFormUnchanged}
              >
                {isUpdating ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>

      {addressSuggestion && (
        <AddressSelectionDialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          onSelect={handleAddressSelection}
          originalAddress={addressSuggestion.originalAddress}
          recommendedAddress={addressSuggestion.suggestedAddress}
          messages={addressSuggestion.messages}
        />
      )}
    </div>
  );
} 