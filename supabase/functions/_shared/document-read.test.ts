import { MAX_TEXT, parseReadResponse, toBase64 } from './document-read.ts';

function eq(a: unknown, b: unknown) { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`${JSON.stringify(a)} !== ${JSON.stringify(b)}`); }

Deno.test('lecture : texte recopié, caractères de contrôle retirés', () => {
  eq(parseReadResponse('```json\n{"text":"Ferritine 9 µg/L\\u0007\\r\\nTSH [illisible]","illegible_passages":1}\n```'), { text: 'Ferritine 9 µg/L\nTSH [illisible]', illegible: 1 });
});
Deno.test('lecture : réponse inexploitable → null (jamais de texte inventé)', () => {
  eq(parseReadResponse('Je ne peux pas lire ce document.'), null);
  eq(parseReadResponse('{"text":"   "}'), null);
  eq(parseReadResponse('{"summary":"ok"}'), null);
});
Deno.test('lecture : passages illisibles comptés si absents, texte borné', () => {
  eq(parseReadResponse('{"text":"a [illisible] b [Illisible]"}')!.illegible, 2);
  eq(parseReadResponse(JSON.stringify({ text: 'x'.repeat(MAX_TEXT + 50) }))!.text.length, MAX_TEXT);
});
Deno.test('base64', () => { eq(toBase64(new TextEncoder().encode('PDF').buffer), 'UERG'); });
