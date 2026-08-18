import {
  DeleteMessageCommand,
  ReceiveMessageCommand,
  SQSClient,
} from "@aws-sdk/client-sqs";

export interface ScanQueueMessage {
  receiptHandle: string;
  body: unknown;
}

export interface ScanEventQueue {
  receive(maxMessages?: number): Promise<ScanQueueMessage[]>;
  acknowledge(receiptHandle: string): Promise<void>;
}

export class SqsScanEventQueue implements ScanEventQueue {
  private readonly client: SQSClient;

  constructor(
    region: string,
    private readonly queueUrl: string,
  ) {
    this.client = new SQSClient({ region });
  }

  static fromEnvironment(): SqsScanEventQueue {
    const region = process.env.AWS_REGION;
    const queueUrl = process.env.S3_GUARDDUTY_SCAN_QUEUE_URL;
    if (!region || !queueUrl) {
      throw new Error("AWS_REGION and S3_GUARDDUTY_SCAN_QUEUE_URL are required.");
    }
    return new SqsScanEventQueue(region, queueUrl);
  }

  async receive(maxMessages = 10): Promise<ScanQueueMessage[]> {
    const response = await this.client.send(
      new ReceiveMessageCommand({
        QueueUrl: this.queueUrl,
        MaxNumberOfMessages: Math.min(10, Math.max(1, maxMessages)),
        WaitTimeSeconds: 1,
        VisibilityTimeout: 60,
      }),
    );

    return (response.Messages ?? []).flatMap((message) => {
      if (!message.Body || !message.ReceiptHandle) {
        return [];
      }
      try {
        return [
          {
            receiptHandle: message.ReceiptHandle,
            body: JSON.parse(message.Body) as unknown,
          },
        ];
      } catch {
        throw new Error("Invalid JSON in the GuardDuty scan queue.");
      }
    });
  }

  async acknowledge(receiptHandle: string): Promise<void> {
    await this.client.send(
      new DeleteMessageCommand({
        QueueUrl: this.queueUrl,
        ReceiptHandle: receiptHandle,
      }),
    );
  }
}
