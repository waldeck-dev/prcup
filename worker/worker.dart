import 'package:dotenv/dotenv.dart';

import 'gh_api.dart';
import 'save_mgr.dart';

final env = DotEnv()..load();

main() async {
  if (!env.isDefined('SAVE_FILE')) {
    throw Exception("`SAVE_FILE` env finaliable must be set");
  }

  final saveMgr = SaveManager(env['SAVE_FILE'] as String);

  final gh = GithubApi(env['GH_OWNER'] as String, env['GH_REPO'] as String,
      env['GH_TOKEN'] as String);

  final latestPull = await gh.getLatestPull();

  final pullsToProcess = saveMgr.getPullsToProcess(latestPull);

  for (final pullNumber in pullsToProcess) {
    final pull = await gh.getPull(pullNumber);
    saveMgr.processPull(pull);
  }
}
