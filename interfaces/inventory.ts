type InventoryState =
  | "CUSTOM"
  | "IN_STOCK"
  | "SOLD"
  | "RETURNED_BY_CUSTOMER"
  | "RESERVED_FOR_SALE"
  | "SOLD_ONLINE"
  | "ORDERED_FROM_VENDOR"
  | "RECEIVED_FROM_VENDOR"
  | "IN_TRANSIT_TO"
  | "NONE"
  | "WASTE"
  | "UNLINKED_RETURN"
  | "COMPOSED"
  | "DECOMPOSED"
  | "SUPPORTED_BY_NEWER_VERSION"
  | "IN_TRANSIT";
  
export interface InventoryCount {
  catalogObjectId?: string | null;
  catalogObjectType?: string | null;
  state?: InventoryState;
  locationId?: string | null;
  quantity?: string | null;
  calculatedAt?: string;
  isEstimated?: boolean;
}
