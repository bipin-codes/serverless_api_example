import { ICategory } from '../../validationSchema/category';

export default interface ICategoryRepositoryInterface {
    all(): Promise<ICategory[]>;
    create(data: ICategory): Promise<ICategory>;
    delete(id: string): Promise<ICategory>;
    update(category: ICategory): Promise<ICategory>;
}
