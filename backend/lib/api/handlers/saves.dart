import 'dart:convert';

import 'package:shelf/shelf.dart';

import 'package:prcup_backend/common/save_mgr.dart';

Future<Response> RetrieveSaveHandler(Request request) async {
  final saveMgr = SaveManager();
  final save = await saveMgr.init();
  return Response.ok(jsonEncode(save),
      headers: {'Content-Type': 'application/json'},
      encoding: Encoding.getByName('UTF-8'));
}
