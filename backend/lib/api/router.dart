import 'package:shelf_router/shelf_router.dart';

import 'package:prcup_backend/api/handlers/saves.dart';

class MainRouter {
  final router = Router();

  MainRouter() {
    router.mount('/prcup-api', APIRouter().router);
  }
}

class APIRouter {
  final router = Router();

  APIRouter() {
    router.get('/saves', RetrieveSaveHandler);
  }
}
