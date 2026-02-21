const msg = new TextEncoder().encode('data: hello\r\n\r\n');

Deno.serve((req: Request) => {
  // add unknown only for node compilation
  let timerId: number | undefined | unknown;
  const body = new ReadableStream({
    start(controller) {
      timerId = setInterval(() => {
        controller.enqueue(msg);
      }, 1000);
    },
    cancel() {
      if (typeof timerId === 'number') {
        clearInterval(timerId);
      }
    },
  });

  return new Response(body, {
    headers: {
      'Content-Type': 'text/event-stream',
    },
  });
});
