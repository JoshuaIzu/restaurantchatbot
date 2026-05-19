import { MenuItem } from '../types';

export interface CreateMenuItemInput {
    name: string;
    price: number;
    category?: string;
}
export interface UpdateMenuItemInput {
    name?: string;
    price?: number;
    category?: string;
    available?: boolean;
}

export interface IMenuRepository {
    getAvailableItems(): Promise<MenuItem[]>;
    getAllItems(): Promise<MenuItem[]>;
    getItemById(id: string): Promise<MenuItem | undefined>;
    createItem(data: CreateMenuItemInput): Promise<MenuItem>;
    updateItem(id: string, data: UpdateMenuItemInput): Promise<MenuItem>;
    deleteItem(id: string): Promise<void>;
}
