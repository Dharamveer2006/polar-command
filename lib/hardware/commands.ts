// SIH26060 Polar Command - Hardware Command & Actuator Layer
// Secure operator control pipeline with RBAC authorization and multi-step execution lifecycle.

import { 
  CommandPacket, 
  HardwareCommandType, 
  CommandStatus 
} from './types';
import { StationId, User } from '@/types';
import { hasPermission } from '../permissions';
import { ProtocolAdapterRegistry } from './protocols';

export interface CommandExecutionResult {
  success: boolean;
  packet: CommandPacket;
  message: string;
  isActuatorFailure?: boolean;
}

export class HardwareCommandDispatcher {
  private commandHistory: CommandPacket[] = [];

  constructor() {
    // Initial mock historical commands for realism
    this.commandHistory.push({
      commandId: 'cmd-bhr-091',
      deviceId: 'BHR-GEN-01-ACT',
      assetId: 'bharati-gen-1',
      stationId: 'bharati',
      command: 'START',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      operator: 'Vikram Joshi',
      operatorRole: 'Station Engineer',
      status: 'EXECUTED',
      acknowledgedAt: new Date(Date.now() - 3599950).toISOString(),
      executedAt: new Date(Date.now() - 3599890).toISOString()
    });
  }

  getHistory(stationId?: StationId): CommandPacket[] {
    if (stationId) {
      return this.commandHistory.filter(c => c.stationId === stationId);
    }
    return [...this.commandHistory];
  }

  /**
   * Dispatches an industrial operator command with full permission check and lifecycle transitions
   */
  async executeCommand(params: {
    stationId: StationId;
    deviceId: string;
    assetId: string;
    command: HardwareCommandType;
    currentUser: User;
    forceActuatorFailure?: boolean;
  }): Promise<CommandExecutionResult> {
    const { stationId, deviceId, assetId, command, currentUser, forceActuatorFailure } = params;

    // 1. RBAC authorization check
    // Operator commands require Station Engineer or NCPOR Operations (canEditDashboard)
    if (!hasPermission(currentUser.role, 'canEditDashboard')) {
      const failedPacket: CommandPacket = {
        commandId: `cmd-${Date.now().toString(36)}`,
        deviceId,
        assetId,
        stationId,
        command,
        timestamp: new Date().toISOString(),
        operator: currentUser.name,
        operatorRole: currentUser.role,
        status: 'FAILED',
        failureReason: `RBAC ACCESS DENIED: Role '${currentUser.role}' is not authorized to actuate Antarctic field equipment.`
      };
      this.commandHistory.unshift(failedPacket);
      return {
        success: false,
        packet: failedPacket,
        message: failedPacket.failureReason!
      };
    }

    // 2. Create initial QUEUED packet
    const commandId = `CMD-${stationId.toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const packet: CommandPacket = {
      commandId,
      deviceId,
      assetId,
      stationId,
      command,
      parameters: { forceActuatorFailure },
      timestamp: new Date().toISOString(),
      operator: currentUser.name,
      operatorRole: currentUser.role,
      status: 'QUEUED'
    };

    // 3. Dispatch through Protocol Adapter
    const adapter = ProtocolAdapterRegistry.getAdapter('SIMULATED');
    const resultPacket = await adapter.dispatchCommand(packet);

    this.commandHistory.unshift(resultPacket);

    if (resultPacket.status === 'FAILED') {
      return {
        success: false,
        packet: resultPacket,
        isActuatorFailure: true,
        message: `ACTUATOR COMMAND FAILED: ${resultPacket.failureReason}`
      };
    }

    return {
      success: true,
      packet: resultPacket,
      message: `Equipment ${deviceId} acknowledged and successfully transitioned to ${command} state.`
    };
  }
}
