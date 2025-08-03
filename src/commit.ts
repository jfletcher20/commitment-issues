class Commit {
  constructor(
    public commit: string,
    public header: string,
    public body: string,
    public url: string,
    public authorName: string,
    public branch: string,
    public repoHasOpenTasks: boolean,
    public referencedTasks: string[] = []
  ) {
    this.commit = commit;
    this.header = header;
    this.body = body;
    this.url = url;
    this.authorName = authorName;
    this.branch = branch;
    this.repoHasOpenTasks = repoHasOpenTasks;
    this.referencedTasks = referencedTasks;
  }
}
export { Commit };
