import "server-only";
import { Shippo } from "shippo";
import { getServiceKey } from "@lib/service-keys";
import type { CustomerAddress as SquareCustomerAddress } from "@lib/contracts/customer";

async function createShippoClient() {
  const apiKey = await getServiceKey("SHIPPO_API_KEY");
  if (!apiKey) throw new Error("SHIPPO_API_KEY is not configured");
  return new Shippo({ apiKeyHeader: apiKey });
}

interface ShippoAddressValidationResult {
  isValid: boolean;
  messages: Array<{
    code: string;
    source: string;
    text: string;
    type: string;
  }>;
  validatedAddress?: SquareCustomerAddress;
}

export async function validateAddress(address: SquareCustomerAddress): Promise<ShippoAddressValidationResult> {
  const shippo = (await createShippoClient());

  try {
    // Convert Square address format to Shippo format
    const shippoAddress = {
      name: "", // Optional for validation
      street1: address.addressLine1 ?? "",
      street2: address.addressLine2,
      city: address.locality ?? "",
      state: address.administrativeDistrictLevel1 ?? "",
      zip: address.postalCode ?? "",
      country: address.country ?? "US",
      validate: true,
    };

    const result = await shippo.addresses.create(shippoAddress);

    // Convert Shippo response back to Square format
    const validatedAddress: SquareCustomerAddress = {
      addressLine1: result.street1 || address.addressLine1,
      addressLine2: result.street2 || address.addressLine2,
      locality: result.city || address.locality,
      administrativeDistrictLevel1: result.state || address.administrativeDistrictLevel1,
      postalCode: result.zip || address.postalCode,
      country: result.country || address.country,
    };

    return {
      isValid: result.validationResults?.isValid ?? false,
      messages: (result.validationResults?.messages || []).map(msg => ({
        code: msg.code || 'UNKNOWN',
        source: msg.source || 'Shippo',
        text: msg.text || 'Unknown validation message',
        type: msg.type || 'error'
      })),
      validatedAddress: result.validationResults?.isValid ? validatedAddress : undefined,
    };
  } catch (error) {
    console.error('Error validating address with Shippo:', error);
    return {
      isValid: false,
      messages: [{
        code: 'VALIDATION_ERROR',
        source: 'Shippo',
        text: 'Failed to validate address',
        type: 'error'
      }]
    };
  }
}
