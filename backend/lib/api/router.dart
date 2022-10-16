import 'package:shelf_router/shelf_router.dart';

import 'package:prcup_backend/api/handlers/saves.dart';

class APIRouter {
  final router = Router();

  APIRouter() {
    router.get('/saves', RetrieveSaveHandler);
  }
}
