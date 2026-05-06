export interface Employee {
  id: number;
  name: string;
  role: string;
  base_pay: number;
  commission_rate: number;
  active: boolean;
  created_at?: string;
}

export interface Service {
  id: number;
  name: string;
  category: string;
  default_price: number;
  commission_rate: number;
  active: boolean;
  created_at?: string;
}

export interface PayrollService {
  service_name: string;
  price: number;
  qty: number;
  commission_rate: number;
  commission_amount: number;
}

export interface PayrollRecord {
  id: number;
  employee_id: number;
  employee_name?: string;
  week_ending: string;
  week_label: string;
  base_pay: number;
  deductions: number;
  total_commission: number;
  gross_pay: number;
  net_pay: number;
  services?: PayrollService[];
  created_at?: string;
}