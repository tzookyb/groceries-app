export interface Item {
  id: string;
  name: string;
}

export interface Shop {
  id: string;
  name: string;
}

export interface GroceryData {
  version: 3;
  updatedAt: number;
  items: Item[];
  shops: Shop[];
}
