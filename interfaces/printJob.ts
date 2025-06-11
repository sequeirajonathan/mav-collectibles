export interface PrintJob {
  id: string;
  order_id: string;
  label_url: string;
  status: string;
  claimed_by: string | null;
  claimed_at: string | null;
  printed_at: string | null;
  retries: number;
  last_tried_at: string | null;
  created_at: string;
  updated_at: string;
} 