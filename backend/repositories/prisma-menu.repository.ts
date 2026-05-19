import { PrismaClient } from "../generated/prisma/client";
import { IMenuRepository, CreateMenuItemInput, UpdateMenuItemInput } from "./menu.repository";
import { MenuItem } from "../types";


export class PrismaMenuRepository implements IMenuRepository {
    constructor(private readonly prisma: PrismaClient) {}
    public async getAllItems(): Promise<MenuItem[]> {
        const items = await this.prisma.menuItem.findMany({
            orderBy: { id: "asc"},
        });
        return items.map(item => ({
            id: String(item.id),
            name: item.name,
            price: item.price,
            category: item.category,
            available: item.available,
        }));
    }
    public async getAvailableItems(): Promise<MenuItem[]> {
        const items = await this.prisma.menuItem.findMany({
            where: { available: true },
            orderBy: { id: "asc" },
        });

        return items.map((item) => ({
            id: String(item.id),
            name: item.name,
            price: item.price,
            category: item.category,
            available: item.available,
        }))
    }

    public async getItemById(id:string): Promise<MenuItem | undefined> {
        const item = await this.prisma.menuItem.findUnique({
            where: { id: BigInt(id), available: true }
        });
        if(!item) return undefined;

        return {
            id: String(item.id),
            name: item.name,
            price: item.price,
            category: item.category,
            available: item.available,
        }
    }
    public async createItem(data: CreateMenuItemInput): Promise<MenuItem> {
        const item = await this.prisma.menuItem.create({
            data: {
                name: data.name,
                price: data.price,
                category: data.category ?? "main",
            },
        });
        return {
            id: String(item.id),
            name: item.name,
            price: item.price,
            category: item.category,
            available: item.available,
        };
    }
    public async updateItem(id: string, data: UpdateMenuItemInput): Promise<MenuItem> {
        const item = await this.prisma.menuItem.update({
            where: { id: BigInt(id) },
            data: {
                ...(data.name !== undefined && { name: data.name }),
                ...(data.price !== undefined && { price: data.price }),
                ...(data.category !== undefined && { category: data.category }),
                ...(data.available !== undefined && { available: data.available }),
            }
        });
        return {
            id: String(item.id),
            name: item.name,
            price: item.price,
            category: item.category,
            available: item.available,
        };
    }
    public async deleteItem(id: string): Promise<void>{
        await this.prisma.menuItem.update({
            where: { id: BigInt(id) },
            data: { available: false },
        });
    }
}