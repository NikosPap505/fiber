const axios = require('axios');

class PhotoController {
    async getPhoto(req, res) {
        try {
            const { file_id } = req.params;
            const botToken = process.env.TELEGRAM_BOT_TOKEN;

            // Get file path from Telegram
            const fileResponse = await axios.get(`https://api.telegram.org/bot${botToken}/getFile?file_id=${file_id}`);

            if (!fileResponse.data.ok) {
                return res.status(404).json({ error: 'Photo not found' });
            }

            const filePath = fileResponse.data.result.file_path;
            const photoUrl = `https://api.telegram.org/file/bot${botToken}/${filePath}`;

            // Fetch the actual photo
            const photoResponse = await axios.get(photoUrl, { responseType: 'arraybuffer' });

            // Send photo with proper content type
            res.set('Content-Type', 'image/jpeg');
            res.send(photoResponse.data);
        } catch (error) {
            console.error('Error fetching photo:', error);
            res.status(500).json({ error: 'Failed to fetch photo' });
        }
    }
}

module.exports = new PhotoController();
