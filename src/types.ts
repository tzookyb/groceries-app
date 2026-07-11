export interface Item {
  id: string;
  name: string;
  shopIds: string[];
}

export interface Shop {
  id: string;
  name: string;
  color: string;
}

export interface GroceryData {
  version: 4;
  updatedAt: number;
  items: Item[];
  shops: Shop[];
}
