type QueryValue = string | number | boolean | null | undefined;

type SearchParamsLike = {
  entries(): IterableIterator<[string, string]>;
};

type SearchParamUpdate = {
  defaultValue?: QueryValue;
  name: string;
  value: QueryValue;
};

export function buildUpdatedSearchParams(
  searchParams: SearchParamsLike,
  updates: SearchParamUpdate[]
) {
  const params = new URLSearchParams(Array.from(searchParams.entries()));

  updates.forEach(({ defaultValue, name, value }) => {
    if (value === null || value === undefined || value === defaultValue || value === "") {
      params.delete(name);
      return;
    }

    params.set(name, String(value));
  });

  return params.toString();
}
