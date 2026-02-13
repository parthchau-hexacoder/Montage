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
        const removed = this.connections.filter(
            (c) =>
                c.fromModuleId === moduleId || c.toModuleId === moduleId
        );

        this.connections = this.connections.filter(
            (c) =>
                c.fromModuleId !== moduleId && c.toModuleId !== moduleId
        );

        return removed;
    }

    getConnectionsForModule(moduleId: string) {
        return this.connections.filter(
            (c) =>
                c.fromModuleId === moduleId || c.toModuleId === moduleId
        );
    }

    getConnectedModuleIds(seedModuleId: string): Set<string> {
        const visited = new Set<string>();
        const queue: string[] = [seedModuleId];

        while (queue.length > 0) {
            const current = queue.shift();
            if (!current || visited.has(current)) continue;

            visited.add(current);

            for (const connection of this.connections) {
                if (connection.fromModuleId === current && !visited.has(connection.toModuleId)) {
                    queue.push(connection.toModuleId);
                }

                if (connection.toModuleId === current && !visited.has(connection.fromModuleId)) {
                    queue.push(connection.fromModuleId);
                }
            }
        }

        return visited;
    }
}
