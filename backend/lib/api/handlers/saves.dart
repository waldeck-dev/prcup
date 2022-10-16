import 'package:shelf/shelf.dart';

Future<Response> RetrieveSaveHandler(Request request) async {
  return await Response.ok('Lorem ipsum');
}
