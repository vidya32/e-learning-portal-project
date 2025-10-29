const { app } = require('@azure/functions');
const { BlobServiceClient } = require('@azure/storage-blob');
const multiparty = require('multiparty');
const fs = require('fs');

const connectionString = process.env.Azure_Storage_Connection_String;
const containerName = "files";

app.http('uploadFile', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: (request, context) => {
        return new Promise((resolve) => {
            const form = new multiparty.Form();
            form.parse(request.httpRequest, async (err, fields, files) => {
                if (err) {
                    context.log(`Error parsing form: ${err}`);
                    return resolve({ status: 400, body: `Error parsing form data.` });
                }
                try {
                    const file = files.file[0];
                    if (!connectionString) throw new Error("Azure Storage Connection String is missing.");
                    
                    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
                    const containerClient = blobServiceClient.getContainerClient(containerName);
                    // Sanitize the original filename to remove potentially unsafe characters
                    const safeFilename = file.originalFilename.replace(/[^a-zA-Z0-9._-]/g, '_'); 
                    const blobName = `${new Date().getTime()}-${safeFilename}`;
                    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

                    await blockBlobClient.uploadStream(fs.createReadStream(file.path));
                    
                    resolve({ status: 200, jsonBody: { url: blockBlobClient.url } });
                } catch (error) {
                    context.log(`FATAL ERROR during upload: ${error.message}`);
                    resolve({ status: 500, body: `Error uploading file. Check terminal logs.` });
                }
            });
        });
    }
});