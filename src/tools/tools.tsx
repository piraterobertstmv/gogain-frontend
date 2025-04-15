export function formatString(str: string) {
    return str
      .split('')
      .map((char: any, index: number) => {
        if (index === 0) {
          return char.toUpperCase();
        } else if (char === char.toUpperCase() && char !== char.toLowerCase()) {
          return ' ' + char.toLowerCase();
        }
        return char;
      })
      .join('');
}

export function findNameWithId(data: any, id: string, colName: string) {
  if (id === null)
      return ""

  if (Object.keys(data).length === 0)
      return ""

  if (!(colName in data))
      return ""

  for (const value of data[colName]) {
      if (value._id === id) {
          if (colName === "users") {
              return (value.firstName + " " + value.lastName)
          }
          if (colName === "client") {
            return (value.lastName + " " + value.firstName)
          }
          return value.name;
      }
  }
  return "";
}

export function findObjWithId(data: any, id: string, colName: string) {
  for (const value of data[colName]) {
      if (value._id === id) {
          return value;
      }
  }
  return "";
}