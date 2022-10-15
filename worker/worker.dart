import 'gh_api.dart';
import 'save_mgr.dart';

main() async {
  final saveMgr = WorkerSaveManager();
  await saveMgr.init();

  final gh = GithubApi(
      const String.fromEnvironment('GH_OWNER'),
      const String.fromEnvironment('GH_REPO'),
      const String.fromEnvironment('GH_TOKEN'));

  final latestPull = await gh.getLatestPull();

  final pullsToProcess = saveMgr.getPullsToProcess(latestPull);
  if (pullsToProcess.isEmpty) return;

  for (final pullNumber in pullsToProcess) {
    final pull = await gh.getPull(pullNumber);
    saveMgr.processPull(pull);
  }

  saveMgr.persist();
}
