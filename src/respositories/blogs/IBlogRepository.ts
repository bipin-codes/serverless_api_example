import { IBlog } from '../../validationSchema/blog';

export default interface IBlogRepository {
    all(
        lastKey: string,
        limit: number
    ): Promise<{ blogs: IBlog[]; lastKey: string | undefined }>;

    create(content: IBlog): Promise<IBlog>;

    delete(id: string): Promise<IBlog>;
}
