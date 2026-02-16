export type ConnectionRecord = {
    fromModuleId: string;
    fromNodeId: string;
    toModuleId: string;
    toNodeId: string;
};

export class ConnectionGraph {
    connections: ConnectionRecord[] = [];
    version = 0;

    addConnection(record: ConnectionRecord) {
        this.connections.push(record);
        this.version += 1;
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

        if (removed.length > 0) {
            this.version += 1;
        }

        return removed;
    }

    replaceConnections(connections: ConnectionRecord[]) {
        this.connections = connections;
        this.version += 1;
    }

    getConnectionsForModule(moduleId: string) {
        return this.connections.filter(
            (c) =>
                c.fromModuleId === moduleId || c.toModuleId === moduleId
        );
    }

    getConnectedModuleIds(seedModuleId: string): Set<string> {
        const adjacency = new Map<string, string[]>();

        for (const connection of this.connections) {
            if (!adjacency.has(connection.fromModuleId)) {
                adjacency.set(connection.fromModuleId, []);
            }
            if (!adjacency.has(connection.toModuleId)) {
                adjacency.set(connection.toModuleId, []);
            }

            adjacency.get(connection.fromModuleId)!.push(connection.toModuleId);
            adjacency.get(connection.toModuleId)!.push(connection.fromModuleId);
        }

        const visited = new Set<string>();
        const queue: string[] = [seedModuleId];
        let cursor = 0;

        while (cursor < queue.length) {
            const current = queue[cursor++];
            if (visited.has(current)) continue;

            visited.add(current);

            const neighbors = adjacency.get(current);
            if (!neighbors) continue;

            for (const neighbor of neighbors) {
                if (!visited.has(neighbor)) {
                    queue.push(neighbor);
                }
            }
        }

        return visited;
    }
}
