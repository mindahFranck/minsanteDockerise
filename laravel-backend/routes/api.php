<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\RegionController;
use App\Http\Controllers\Api\DepartementController;
use App\Http\Controllers\Api\ArrondissementController;
use App\Http\Controllers\Api\CommuneController;
use App\Http\Controllers\Api\DistrictController;
use App\Http\Controllers\Api\AiresanteController;
use App\Http\Controllers\Api\FosaController;
use App\Http\Controllers\Api\BatimentController;
use App\Http\Controllers\Api\ServiceController;
use App\Http\Controllers\Api\PersonnelController;
use App\Http\Controllers\Api\EquipementController;
use App\Http\Controllers\Api\EquipebioController;
use App\Http\Controllers\Api\MaterielroulantController;
use App\Http\Controllers\Api\CategorieController;
use App\Http\Controllers\Api\DegradationController;
use App\Http\Controllers\Api\ParametreController;
use App\Http\Controllers\Api\StatisticsController;
use App\Http\Controllers\Api\AuditController;
use App\Http\Controllers\Api\ImportController;
use App\Http\Controllers\Api\HealthController;
use App\Http\Controllers\Api\CamerounController;
use App\Http\Controllers\Api\ImportFosaController;

/*
|--------------------------------------------------------------------------
| Health Check (public)
|--------------------------------------------------------------------------
*/
Route::prefix('health')->group(function () {
    Route::get('/', [HealthController::class, 'check']);
    Route::get('/ready', [HealthController::class, 'ready']);
    Route::get('/live', [HealthController::class, 'live']);
});

Route::prefix('v1')->group(function () {

    /*
    |--------------------------------------------------------------------------
    | Auth (public sauf /me, /password, /logout)
    |--------------------------------------------------------------------------
    */
    Route::prefix('auth')->middleware('throttle:10,1')->group(function () {
        Route::post('/register', [AuthController::class, 'register']);
        Route::post('/login', [AuthController::class, 'login']);
        Route::post('/refresh', [AuthController::class, 'refresh']);

        Route::middleware('auth:api')->group(function () {
            Route::get('/me', [AuthController::class, 'me']);
            Route::put('/password', [AuthController::class, 'changePassword']);
            Route::post('/logout', [AuthController::class, 'logout']);
        });
    });

    /*
    |--------------------------------------------------------------------------
    | PUBLIC ROUTES (pas d'auth, exactement comme l'ancien backend)
    |--------------------------------------------------------------------------
    */

    // Regions - GET + map/spatial public
    Route::get('/regions', [RegionController::class, 'index']);
    Route::get('/regions/map/all', [RegionController::class, 'mapAll']);
    Route::get('/regions/map/{id}', [RegionController::class, 'mapById']);
    Route::get('/regions/spatial/{id}', [RegionController::class, 'spatial']);
    Route::get('/regions/{id}', [RegionController::class, 'show']);

    // Departements - GET public
    Route::get('/departements', [DepartementController::class, 'index']);
    Route::get('/departements/{id}', [DepartementController::class, 'show']);

    // Arrondissements - GET public
    Route::get('/arrondissements', [ArrondissementController::class, 'index']);
    Route::get('/arrondissements/{id}', [ArrondissementController::class, 'show']);

    // Communes - GET public
    Route::get('/communes', [CommuneController::class, 'index']);
    Route::get('/communes/{id}', [CommuneController::class, 'show']);

    // Districts - GET + map public
    Route::get('/districts', [DistrictController::class, 'index']);
    Route::get('/districts/map/all', [DistrictController::class, 'mapAll']);
    Route::get('/districts/map/region/{regionId}', [DistrictController::class, 'mapByRegion']);
    Route::get('/districts/map/{id}', [DistrictController::class, 'mapById']);
    Route::get('/districts/{id}', [DistrictController::class, 'show']);

    // Airesantes - GET + map public
    Route::get('/airesantes', [AiresanteController::class, 'index']);
    Route::get('/airesantes/map/all', [AiresanteController::class, 'mapAll']);
    Route::get('/airesantes/map/district/{districtId}', [AiresanteController::class, 'mapByDistrict']);
    Route::get('/airesantes/map/{id}', [AiresanteController::class, 'mapById']);

    // Cameroun - tout public en GET
    Route::get('/cameroun', [CamerounController::class, 'index']);
    Route::get('/cameroun/{id}', [CamerounController::class, 'show']);

    // FOSA - toutes les GET sont publiques
    Route::prefix('fosas')->group(function () {
        Route::get('/', [FosaController::class, 'index']);
        Route::get('/closed', [FosaController::class, 'closed']);
        Route::get('/type/{type}', [FosaController::class, 'byType']);
        Route::get('/map/all', [FosaController::class, 'mapAll']);
        Route::get('/map/airesante/{airesanteId}', [FosaController::class, 'mapByAiresante']);
        Route::get('/map/{id}', [FosaController::class, 'mapById']);
        Route::get('/spatial/region/{regionId}', [FosaController::class, 'spatialByRegion']);
        Route::get('/spatial/departement/{departementId}', [FosaController::class, 'spatialByDepartement']);
        Route::get('/spatial/arrondissement/{arrondissementId}', [FosaController::class, 'spatialByArrondissement']);
        Route::get('/spatial/district/{districtId}', [FosaController::class, 'spatialByDistrict']);
        Route::get('/spatial/airesante/{airesanteId}', [FosaController::class, 'spatialByAiresante']);
        Route::get('/{id}', [FosaController::class, 'show']);
    });

    // Audit - GET public (comme l'ancien backend)
    Route::prefix('audit')->group(function () {
        Route::get('/users/{userId}', [AuditController::class, 'userHistory']);
        Route::get('/resources/{resource}/{resourceId}', [AuditController::class, 'resourceHistory']);
        Route::get('/recent', [AuditController::class, 'activity']);
        Route::get('/stats', [AuditController::class, 'stats']);
    });

    // Import FOSA - public (comme l'ancien backend)
    Route::post('/import-fosa/clear-and-import', [ImportFosaController::class, 'clearAndImport']);

    /*
    |--------------------------------------------------------------------------
    | PROTECTED ROUTES (auth requise)
    |--------------------------------------------------------------------------
    */
    Route::middleware(['auth:api', 'geographic.scope'])->group(function () {

        // Users - GET protégé, CUD super_admin
        Route::get('/users', [UserController::class, 'index']);
        Route::get('/users/{id}', [UserController::class, 'show']);
        Route::middleware('role:super_admin')->group(function () {
            Route::post('/users', [UserController::class, 'store']);
            Route::put('/users/{id}', [UserController::class, 'update']);
            Route::delete('/users/{id}', [UserController::class, 'destroy']);
        });

        // Regions - CUD protégé
        Route::post('/regions', [RegionController::class, 'store'])->middleware('role:manager,admin,super_admin');
        Route::put('/regions/{id}', [RegionController::class, 'update'])->middleware('role:manager,admin,super_admin');
        Route::delete('/regions/{id}', [RegionController::class, 'destroy'])->middleware('role:super_admin');

        // Departements - CUD protégé
        Route::post('/departements', [DepartementController::class, 'store'])->middleware('role:manager,admin,super_admin');
        Route::put('/departements/{id}', [DepartementController::class, 'update'])->middleware('role:manager,admin,super_admin');
        Route::delete('/departements/{id}', [DepartementController::class, 'destroy'])->middleware('role:super_admin');

        // Arrondissements - CUD protégé
        Route::post('/arrondissements', [ArrondissementController::class, 'store'])->middleware('role:manager,admin,super_admin');
        Route::put('/arrondissements/{id}', [ArrondissementController::class, 'update'])->middleware('role:manager,admin,super_admin');
        Route::delete('/arrondissements/{id}', [ArrondissementController::class, 'destroy'])->middleware('role:super_admin');

        // Communes - CUD protégé
        Route::post('/communes', [CommuneController::class, 'store'])->middleware('role:manager,admin,super_admin');
        Route::put('/communes/{id}', [CommuneController::class, 'update'])->middleware('role:manager,admin,super_admin');
        Route::delete('/communes/{id}', [CommuneController::class, 'destroy'])->middleware('role:super_admin');

        // Districts - CUD protégé
        Route::post('/districts', [DistrictController::class, 'store'])->middleware('role:manager,admin,super_admin');
        Route::put('/districts/{id}', [DistrictController::class, 'update'])->middleware('role:manager,admin,super_admin');
        Route::delete('/districts/{id}', [DistrictController::class, 'destroy'])->middleware('role:super_admin');

        // Airesantes - GET /:id protégé + CUD protégé
        Route::get('/airesantes/{id}', [AiresanteController::class, 'show']);
        Route::post('/airesantes', [AiresanteController::class, 'store'])->middleware('role:manager,admin,super_admin');
        Route::put('/airesantes/{id}', [AiresanteController::class, 'update'])->middleware('role:manager,admin,super_admin');
        Route::delete('/airesantes/{id}', [AiresanteController::class, 'destroy'])->middleware('role:super_admin');

        // FOSA - CUD protégé
        Route::post('/fosas', [FosaController::class, 'store'])->middleware('role:manager,admin,super_admin');
        Route::put('/fosas/{id}', [FosaController::class, 'update'])->middleware('role:manager,admin,super_admin');
        Route::delete('/fosas/{id}', [FosaController::class, 'destroy'])->middleware('role:admin,super_admin');

        // Batiments - tout protégé
        Route::apiResource('batiments', BatimentController::class);

        // Services - tout protégé
        Route::apiResource('services', ServiceController::class);

        // Personnel - tout protégé
        Route::apiResource('personnels', PersonnelController::class);

        // Equipements - tout protégé
        Route::apiResource('equipements', EquipementController::class);

        // Equipebios - tout protégé
        Route::apiResource('equipebios', EquipebioController::class);

        // Materielroulants - tout protégé
        Route::apiResource('materielroulants', MaterielroulantController::class);

        // Categories - tout protégé
        Route::apiResource('categories', CategorieController::class);

        // Degradations - tout protégé
        Route::apiResource('degradations', DegradationController::class);

        // Parametres - tout protégé
        Route::apiResource('parametres', ParametreController::class);

        // Statistics - tout protégé
        Route::prefix('statistics')->group(function () {
            Route::get('/overview', [StatisticsController::class, 'overview']);
            Route::get('/fosas', [StatisticsController::class, 'fosas']);
            Route::get('/personnel', [StatisticsController::class, 'personnel']);
            Route::get('/equipment', [StatisticsController::class, 'equipment']);
            Route::get('/geographic', [StatisticsController::class, 'geographic']);
            Route::get('/buildings', [StatisticsController::class, 'buildings']);
            Route::get('/patients', [StatisticsController::class, 'patients']);
            Route::get('/comparative', [StatisticsController::class, 'comparative']);
            Route::get('/dashboard', [StatisticsController::class, 'dashboard']);
        });

        // Import - protégé
        Route::prefix('import')->group(function () {
            Route::get('/tables', [ImportController::class, 'tables']);
            Route::get('/{table}/structure', [ImportController::class, 'structure']);
            Route::get('/{table}/template', [ImportController::class, 'template']);
            Route::post('/{table}', [ImportController::class, 'import'])->middleware('role:manager,admin,super_admin');
        });
    });
});
