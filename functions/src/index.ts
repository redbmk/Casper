import * as functions from 'firebase-functions';
import language from '@google-cloud/language';

const credentials = require('../.service-account-file.json');

const client = new language.LanguageServiceClient({
  credentials,
  projectId: credentials.project_id,
});

// eslint-disable-next-line import/prefer-default-export
export const processLanguage = functions.firestore.document('documents/{id}')
  .onCreate(async (snapshot) => {
    const { content, type = 'PLAIN_TEXT' } = snapshot.data();

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

      return snapshot.ref.set({ type, results }, { merge: true });
    } catch (error) {
      return snapshot.ref.set({ type, error: error.message }, { merge: true });
    }
  });
