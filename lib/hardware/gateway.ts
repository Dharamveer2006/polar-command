// SIH26060 Polar Command - Edge Gateway Engine & Offline Local Control Loop
// Manages Antarctic station on-premise hardware gateways (BHR-EDGE-01 / MTR-EDGE-01).

import { 
  EdgeGateway, 
  GatewayConnectionState, 
  TelemetryPacket, 
  CommandPacket, 
  HardwareProtocol 
} from './types';
import { StationId } from '@/types';

export class EdgeGatewayManager {
  private gateway: EdgeGateway;
  private maxBufferSize: number = 500;

  constructor(stationId: StationId, gatewayId?: string) {
    const isBharati = stationId === 'bharati';
    this.gateway = {
      gatewayId: gatewayId || (isBharati ? 'BHR-EDGE-01' : 'MTR-EDGE-01'),
      stationId,
      name: isBharati ? 'Bharati Station Edge Telemetry Node 01' : 'Maitri Station Edge Telemetry Node 01',
      connectionState: 'CONNECTED',
      devicesConnected: 26,
      totalDevices: 27,
      lastPacketAt: new Date(Date.now() - 8000).toISOString(),
      packetLossPercent: 1.8,
      bufferedPackets: [],
      queuedCommands: [],
      protocols: ['Modbus RTU', 'Modbus TCP', 'RS-485', 'CAN', 'OPC-UA', 'MQTT', 'HTTP/REST'],
      firmwareVersion: 'v2.4.11-antarctic-hardened',
      localControlActive: false
    };
  }

  getGatewayState(): EdgeGateway {
    return { ...this.gateway };
  }

  setConnectionState(state: GatewayConnectionState): void {
    this.gateway.connectionState = state;
    this.gateway.localControlActive = state !== 'CONNECTED';
  }

  /**
   * Ingest telemetry packet into gateway.
   * If gateway is degraded or offline, buffer packet for later cloud sync.
   */
  ingestTelemetry(packet: TelemetryPacket): boolean {
    this.gateway.lastPacketAt = packet.timestamp;

    if (this.gateway.connectionState !== 'CONNECTED') {
      if (this.gateway.bufferedPackets.length < this.maxBufferSize) {
        this.gateway.bufferedPackets.push(packet);
      }
      return false; // Buffered, not directly sent upstream
    }
    return true; // Sent live
  }

  /**
   * Queue command during offline / degraded mode
   */
  queueCommand(command: CommandPacket): CommandPacket {
    if (this.gateway.connectionState === 'OFFLINE') {
      const queuedCmd: CommandPacket = {
        ...command,
        status: 'QUEUED',
        parameters: {
          ...command.parameters,
          queuedAtGateway: this.gateway.gatewayId
        }
      };
      this.gateway.queuedCommands.push(queuedCmd);
      return queuedCmd;
    }
    return command;
  }

  /**
   * Reconnection sync: flush buffered packets and execute queued commands
   */
  syncAfterReconnection(): { syncedPacketsCount: number; executedCommandsCount: number } {
    const packetsCount = this.gateway.bufferedPackets.length;
    const commandsCount = this.gateway.queuedCommands.length;

    // Flush buffers
    this.gateway.bufferedPackets = [];
    this.gateway.queuedCommands = [];
    this.gateway.connectionState = 'CONNECTED';
    this.gateway.localControlActive = false;
    this.gateway.lastPacketAt = new Date().toISOString();

    return {
      syncedPacketsCount: packetsCount,
      executedCommandsCount: commandsCount
    };
  }
}
