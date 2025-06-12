import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { SquareCustomerAddress } from '@interfaces/square';

type ValidationMessage = {
  code: string;
  source: string;
  text: string;
  type: string;
} | {
  message?: string;
  text?: string;
};

interface AddressSelectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  originalAddress: SquareCustomerAddress;
  recommendedAddress: SquareCustomerAddress;
  onSelect: (address: SquareCustomerAddress) => void;
  messages: ValidationMessage[];
}

export function AddressSelectionDialog({
  isOpen,
  onClose,
  originalAddress,
  recommendedAddress,
  onSelect,
  messages,
}: AddressSelectionDialogProps) {
  const formatAddress = (address: SquareCustomerAddress) => {
    return [
      address.addressLine1,
      address.addressLine2,
      `${address.locality}, ${address.administrativeDistrictLevel1} ${address.postalCode}`,
      address.country,
    ].filter(Boolean).join('\n');
  };

  const getMessageText = (msg: ValidationMessage): string => {
    if ('text' in msg && typeof msg.text === 'string') {
      return msg.text;
    }
    if (!('code' in msg) && 'message' in msg && typeof msg.message === 'string') {
      return msg.message;
    }
    return '';
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-black border border-[#E6B325]/30 p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-[#E6B325] mb-4"
                >
                  Address Verification
                </Dialog.Title>

                {messages.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-[#E6B325] mb-2">Validation Messages</h4>
                    <div className="bg-black border border-[#E6B325]/20 rounded-lg p-4">
                      <ul className="text-sm text-gray-300 space-y-2">
                        {messages.map((msg, index) => (
                          <li key={index} className="flex items-start">
                            <span className="text-[#E6B325] mr-2">•</span>
                            <span>{getMessageText(msg)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                <div className="mt-2 space-y-6">
                  <div>
                    <h4 className="text-sm font-medium text-[#E6B325] mb-2">Original Address</h4>
                    <div className="bg-black border border-[#E6B325]/20 rounded-lg p-4">
                      <pre className="text-sm text-gray-300 whitespace-pre-wrap">
                        {formatAddress(originalAddress)}
                      </pre>
                    </div>
                    <button
                      type="button"
                      className="mt-2 w-full inline-flex justify-center rounded-md border border-[#E6B325]/30 px-4 py-2 text-sm font-medium text-[#E6B325] hover:bg-[#E6B325]/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E6B325] focus-visible:ring-offset-2"
                      onClick={() => onSelect(originalAddress)}
                    >
                      Use Original Address
                    </button>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-[#E6B325] mb-2">Recommended Address</h4>
                    <div className="bg-black border border-[#E6B325]/20 rounded-lg p-4">
                      <pre className="text-sm text-gray-300 whitespace-pre-wrap">
                        {formatAddress(recommendedAddress)}
                      </pre>
                    </div>
                    <button
                      type="button"
                      className="mt-2 w-full inline-flex justify-center rounded-md border border-[#E6B325]/30 px-4 py-2 text-sm font-medium text-[#E6B325] hover:bg-[#E6B325]/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E6B325] focus-visible:ring-offset-2"
                      onClick={() => onSelect(recommendedAddress)}
                    >
                      Use Recommended Address
                    </button>
                  </div>
                </div>

                <div className="mt-6">
                  <button
                    type="button"
                    className="w-full inline-flex justify-center rounded-md border border-transparent bg-[#E6B325] px-4 py-2 text-sm font-medium text-black hover:bg-[#E6B325]/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E6B325] focus-visible:ring-offset-2"
                    onClick={onClose}
                  >
                    Cancel
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
} 