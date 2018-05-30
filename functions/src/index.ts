import * as functions from 'firebase-functions';
import language from '@google-cloud/language';

const credentials = require('../.service-account-file.json');

const client = new language.LanguageServiceClient({
  credentials,
  projectId: credentials.project_id,
});

// eslint-disable-next-line import/prefer-default-export
export const processLanguage = functions.database.ref('documents/{id}')
  .onCreate(async (snapshot) => {
    const { content, type = 'PLAIN_TEXT' } = snapshot.val();

    try {
      const features = {
        extractSyntax: true,
        extractEntities: true,
        extractDocumentSentiment: true,
        extractEntitySentiment: true,
        classifyText: true,
      };

      const [results] = await client.annotateText({
        features,
        document: { type, content },
        encodingType: 'UTF8',
      });

      await snapshot.ref.update({ type, results });
    } catch (error) {
      await snapshot.ref.update({ type, error: error.message });
    }
  });
