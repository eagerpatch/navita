export class ClassList extends String {
  constructor(str: string, public classList: { [key: string]: string[] }) {
    super(str);
  }
}
