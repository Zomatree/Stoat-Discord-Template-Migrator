// place files you want to import through the `$lib` alias in this folder.

export function isNotNullish<V>(value: V | undefined | null): value is V {
    return value != undefined && value != null
}