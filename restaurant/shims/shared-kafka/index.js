export async function sendKafkaNotification(message) {
  try {
    console.log('[shared-kafka shim] sendKafkaNotification called with:',
      typeof message === 'object' ? JSON.stringify(message) : message
    );
  } catch (e) {
    console.log('[shared-kafka shim] message (unserializable)');
  }
  return Promise.resolve();
}

export function sendKafkaNotificationSync(message) {
  console.log('[shared-kafka shim] sendKafkaNotificationSync called');
  return true;
}
