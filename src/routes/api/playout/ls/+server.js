import { json } from '@sveltejs/kit';
import fs from 'fs';
import path from 'path';

export async function GET({ url }) {
    const dir = url.searchParams.get('dir') || 'C:\\';

    try {
        if (!fs.existsSync(dir)) {
            return json({ error: 'Directory does not exist' }, { status: 404 });
        }

        const stats = fs.statSync(dir);
        if (!stats.isDirectory()) {
            return json({ error: 'Path is not a directory' }, { status: 400 });
        }

        const items = fs.readdirSync(dir, { withFileTypes: true });

        const videoExtensions = ['.mp4', '.mkv', '.avi', '.mov', '.mp3', '.wav', '.flv', '.ts', '.m2ts'];

        const result = items.map(item => {
            const fullPath = path.join(dir, item.name);
            const isDirectory = item.isDirectory();
            const ext = path.extname(item.name).toLowerCase();

            return {
                name: item.name,
                path: fullPath,
                isDirectory,
                extension: isDirectory ? '' : ext,
                isVideo: !isDirectory && videoExtensions.includes(ext)
            };
        });

        // Sort: Directories first, then files
        result.sort((a, b) => {
            if (a.isDirectory && !b.isDirectory) return -1;
            if (!a.isDirectory && b.isDirectory) return 1;
            return a.name.localeCompare(b.name);
        });

        return json({
            currentDir: dir,
            parentDir: path.dirname(dir),
            items: result
        });
    } catch (error) {
        console.error('Error reading directory:', error);
        return json({ error: 'Failed to read directory: ' + error.message }, { status: 500 });
    }
}
