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

        const videoExts = ['.mp4', '.mkv', '.mov', '.webm', '.flv', '.ts', '.m2ts', '.m4v', '.avi', '.wmv', '.ogv', '.vob', '.3gp', '.f4v', '.mxf', '.mpg', '.mpeg', '.m2t', '.dv', '.dvcpro', '.asf', '.rm', '.vtt'];
        const audioExts = ['.mp3', '.wav', '.aac', '.m4a', '.ogg', '.opus', '.flac', '.aiff', '.aif', '.wma', '.mka', '.bwf', '.caf', '.m4b', '.m4r', '.mp2', '.mpa'];
        const imageExts = ['.png', '.jpg', '.jpeg', '.bmp', '.tga', '.gif', '.webp', '.svg', '.tiff', '.tif', '.exr', '.hdr', '.psd', '.ico', '.pbm', '.pgm', '.ppm', '.xbm', '.xpm', '.dds'];

        const result = items.map(item => {
            const fullPath = path.join(dir, item.name);
            const isDirectory = item.isDirectory();
            const ext = path.extname(item.name).toLowerCase();

            return {
                name: item.name,
                path: fullPath,
                isDirectory,
                extension: isDirectory ? '' : ext,
                isVideo: !isDirectory && videoExts.includes(ext),
                isAudio: !isDirectory && audioExts.includes(ext),
                isImage: !isDirectory && imageExts.includes(ext)
            };
        });

        // Filter out items that are not directories and not supported media
        const filteredResult = result.filter(item =>
            item.isDirectory || item.isVideo || item.isAudio || item.isImage
        );

        // Sort: Directories first, then files
        filteredResult.sort((a, b) => {
            if (a.isDirectory && !b.isDirectory) return -1;
            if (!a.isDirectory && b.isDirectory) return 1;
            return a.name.localeCompare(b.name);
        });

        return json({
            currentDir: dir,
            parentDir: path.dirname(dir),
            items: filteredResult
        });
    } catch (error) {
        console.error('Error reading directory:', error);
        return json({ error: 'Failed to read directory: ' + error.message }, { status: 500 });
    }
}
