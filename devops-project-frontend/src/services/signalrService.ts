import * as signalR from '@microsoft/signalr';
import { useAuthStore } from '../stores/authStore';

type TableSlotGroup = {
  tableId: number;
  date: string;
};

class SignalRService {
  private connection: signalR.HubConnection | null = null;
  private connectPromise: Promise<void> | null = null;
  private readonly backendUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5235/api').replace(/\/api\/?$/, '');
  private readonly floorPlanGroups = new Set<string>();
  private readonly tableSlotGroups = new Map<string, TableSlotGroup>();

  private buildConnection() {
    if (this.connection) {
      return this.connection;
    }

    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(`${this.backendUrl}/hubs/tablestatus`, {
        accessTokenFactory: () => useAuthStore.getState().token ?? '',
      })
      .withAutomaticReconnect()
      .build();

    this.connection.onreconnected(() => {
      void this.rejoinGroups();
    });

    return this.connection;
  }

  private normalizeFloorPlanGroup(date: string) {
    return date.startsWith('floorplan-') ? date : `floorplan-${date}`;
  }

  private async rejoinGroups() {
    if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
      return;
    }

    for (const groupName of this.floorPlanGroups) {
      await this.connection.invoke('JoinFloorPlanGroup', groupName);
    }

    for (const { tableId, date } of this.tableSlotGroups.values()) {
      await this.connection.invoke('JoinTableSlotGroup', tableId, date);
    }
  }

  public async connect(): Promise<void> {
    const connection = this.buildConnection();

    if (connection.state === signalR.HubConnectionState.Connected) {
      return;
    }

    if (this.connectPromise) {
      return this.connectPromise;
    }

    this.connectPromise = connection
      .start()
      .then(async () => {
        console.log('SignalR Connected');
        await this.rejoinGroups();
      })
      .catch((err) => {
        console.log('Error connecting SignalR', err);
        this.connection = null;
        throw err;
      })
      .finally(() => {
        this.connectPromise = null;
      });

    return this.connectPromise;
  }

  public on(eventName: string, callback: (...args: any[]) => void) {
    const connection = this.buildConnection();
    connection.off(eventName, callback);
    connection.on(eventName, callback);
  }

  public off(eventName: string, callback: (...args: any[]) => void) {
    if (!this.connection) {
      return;
    }

    this.connection.off(eventName, callback);
  }

  public async invoke(methodName: string, ...args: any[]) {
    await this.connect();

    if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
      return;
    }

    return this.connection.invoke(methodName, ...args);
  }

  public async joinFloorPlanGroup(date: string) {
    const groupName = this.normalizeFloorPlanGroup(date);
    this.floorPlanGroups.add(groupName);
    await this.invoke('JoinFloorPlanGroup', groupName);
  }

  public async leaveFloorPlanGroup(date: string) {
    const groupName = this.normalizeFloorPlanGroup(date);
    this.floorPlanGroups.delete(groupName);

    if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
      return;
    }

    await this.connection.invoke('LeaveFloorPlanGroup', groupName);
  }

  public async joinTableSlotGroup(tableId: number, date: string) {
    const key = `${tableId}:${date}`;
    this.tableSlotGroups.set(key, { tableId, date });
    await this.invoke('JoinTableSlotGroup', tableId, date);
  }

  public async leaveTableSlotGroup(tableId: number, date: string) {
    const key = `${tableId}:${date}`;
    this.tableSlotGroups.delete(key);

    if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) {
      return;
    }

    await this.connection.invoke('LeaveTableSlotGroup', tableId, date);
  }

  public disconnect() {
    if (!this.connection) {
      return;
    }

    void this.connection.stop();
    this.connection = null;
    this.connectPromise = null;
    this.floorPlanGroups.clear();
    this.tableSlotGroups.clear();
  }
}

export const signalRService = new SignalRService();
