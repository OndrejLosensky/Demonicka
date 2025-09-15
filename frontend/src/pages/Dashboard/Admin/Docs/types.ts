export type DocFile = {
  name: string;
  title: string;
  description: string;
  path: string;
};

export type DocCategory = {
  name: string;
  title: string;
  description: string;
  files: DocFile[];
};