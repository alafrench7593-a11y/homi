/** Un message : texte simple, ou formes plurielles (catégories Intl.PluralRules : zero, one, two, few, many, other). */
export type Plural = { other: string; zero?: string; one?: string; two?: string; few?: string; many?: string };
export type Msg = string | Plural;
/** Une traduction doit fournir EXACTEMENT les clés du français (source) : une clé oubliée ne compile pas. */
export type Messages<T> = { [K in keyof T]: Msg };
