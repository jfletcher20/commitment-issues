class Commit {
    constructor(public commit: string, public header: string, public body: string, public url: string | undefined = undefined) {
        this.commit = commit;
        this.header = header;
        this.body = body;
        this.url = url;
    }
}
export { Commit };