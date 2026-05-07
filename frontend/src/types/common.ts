export type Nullable<T> = T | null;

export type BaseEntity = {
  id: string;
  createdAt?: string;
  updatedAt?: string;
};

export type SelectOption = {
  label: string;
  value: string;
};

export type StatusValue = "active" | "inactive" | "draft" | "archived";
