class Commit {
    constructor(public commit: string, public header: string, public body: string) {
        this.commit = commit;
        this.header = header;
        this.body = body;
    }
}
export { Commit };