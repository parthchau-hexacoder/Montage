export type ConnectionRecord = {
    fromModuleId: string;
    fromNodeId: string;
    toModuleId: string;
    toNodeId: string;
};

export class ConnectionGraph {
    connections: ConnectionRecord[] = [];

    addConnection(record: ConnectionRecord) {
        this.connections.push(record);
    }

    removeConnectionsForModule(moduleId: string) {
        this.connections = this.connections.filter(
            (c) =>
                c.fromModuleId !== moduleId && c.toModuleId !== moduleId
        );
    }

    getConnectionsForModule(moduleId: string) {
        return this.connections.filter(
            (c) =>
                c.fromModuleId === moduleId || c.toModuleId === moduleId
        );
    }
}
