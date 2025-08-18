class Commit {
  constructor(
    public commitHash: string,
    public header: string,
    public body: string,
    public url: string,
    public authorName: string,
    public branch: string,
    public repoHasOpenTasks: boolean,
    public referencedTasks: string[] = []
  ) {
    this.commitHash = commitHash;
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
