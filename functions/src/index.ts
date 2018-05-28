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
    const document = {
      type: 'PLAIN_TEXT',
      ...snapshot.data(),
    };

    const { type } = document;

    try {
      const features = {
        extractSyntax: true,
        extractEntities: true,
        extractDocumentSentiment: true,
        extractEntitySentiment: true,
        classifyText: true,
      };

      const results = await client.annotateText({ document, features });

      return snapshot.ref.set({ type, results }, { merge: true });
    } catch (error) {
      return snapshot.ref.set({ type, error: error.message }, { merge: true });
    }
  });
