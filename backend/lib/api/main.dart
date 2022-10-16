import 'package:shelf/shelf_io.dart' as shelf_io;

import 'package:prcup_backend/api/router.dart';

void main() async {
  var router = APIRouter().router;

  var server = await shelf_io.serve(router, 'localhost', 8080);

  // Enable content compression
  server.autoCompress = true;

  print('Serving at http://${server.address.host}:${server.port}');
}
