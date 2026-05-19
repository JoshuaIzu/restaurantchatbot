import { Request, Response, Router } from 'express';
import { IMenuRepository, CreateMenuItemInput, UpdateMenuItemInput } from '../repositories/menu.repository';

export class AdminMenuController {
    public readonly router: Router;
    constructor(private readonly menuRepo: IMenuRepository) {
        this.router = Router();
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.use(this.requireAdminKey.bind(this));

        this.router.get('/', this.getAll.bind(this));
        this.router.get('/:id', this.getOne.bind(this));
        this.router.post('/', this.create.bind(this));
        this.router.put('/:id', this.update.bind(this));
        this.router.delete('/:id', this.remove.bind(this));
    }

    private requireAdminKey(req: Request, res: Response, next: Function): void {
        const apiKey = req.headers['x-admin-key'];
        if (!apiKey || apiKey !== process.env.ADMIN_API_KEY) {
            res.status(401).json({ error: 'Unauthorized: Invalid or missing API key' });
            return;
        }
        next();
    }

    private async getAll(_req: Request, res: Response): Promise<void> {
        try {
            const items = await this.menuRepo.getAllItems();
            res.json(items);
        } catch (error) {
            console.error('AdminMenuController.getAll failed:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    private async getOne(req: Request, res: Response): Promise<void> {
        try {
            const id = req.params.id as string;
            const item = await this.menuRepo.getItemById(id);
            if (!item) {
                res.status(404).json({ error: 'Item not found' });
                return;
            }
            res.json(item);
        } catch {
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    private async create(req: Request, res: Response): Promise<void> {
        try {
            const { name, price, category } = req.body as CreateMenuItemInput;
            if (!name || price == null) {
                res.status(400).json({ error: 'name and price are required' });
                return;
            }
            const item = await this.menuRepo.createItem({ name, price, category });
            res.status(201).json(item);
        } catch (error) {
            console.error('AdminMenuController.create failed:', error);
            res.status(400).json({ error: 'Failed to create item. Ensure name is unique.' });
        }
    }

    private async update(req: Request, res: Response): Promise<void> {
        try {
            const id = req.params.id as string;
            const item = await this.menuRepo.updateItem(id, req.body as UpdateMenuItemInput);
            res.json(item);
        } catch (error) {
            console.error('AdminMenuController.update failed:', error);
            res.status(400).json({ error: 'Failed to update item' });
        }
    }

    private async remove(req: Request, res: Response): Promise<void> {
        try {
            const id = req.params.id as string;
            await this.menuRepo.deleteItem(id);
            res.json({ message: 'Item soft-deleted successfully' });
        } catch (error) {
            console.error('AdminMenuController.remove failed:', error);
            res.status(400).json({ error: 'Failed to delete item' });
        }
    }
}