<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

/**
 * @OA\Tag(name="Utilisateurs", description="Gestion des utilisateurs")
 */
class UserController extends Controller
{
    public function __construct(protected AuditService $auditService) {}

    /**
     * @OA\Get(path="/users", tags={"Utilisateurs"}, summary="Liste des utilisateurs",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="per_page", in="query", @OA\Schema(type="integer")),
     *     @OA\Parameter(name="role", in="query", @OA\Schema(type="string")),
     *     @OA\Parameter(name="scope_type", in="query", @OA\Schema(type="string")),
     *     @OA\Response(response=200, description="Liste paginée des utilisateurs")
     * )
     */
    public function index(Request $request): JsonResponse
    {
        $query = User::with(['region', 'departement', 'arrondissement']);

        if ($request->filled('role')) $query->where('role', $request->role);
        if ($request->filled('scope_type')) $query->where('scope_type', $request->scope_type);

        $users = $query->paginate($request->input('per_page', 15));
        return $this->paginatedResponse($users);
    }

    /**
     * @OA\Get(path="/users/{id}", tags={"Utilisateurs"}, summary="Détails d'un utilisateur",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\Response(response=200, description="Détails utilisateur"),
     *     @OA\Response(response=404, description="Utilisateur non trouvé")
     * )
     */
    public function show(int $id): JsonResponse
    {
        $user = User::with(['region', 'departement', 'arrondissement'])->find($id);
        if (!$user) return $this->errorResponse('Utilisateur non trouvé', 404);
        return $this->successResponse($user);
    }

    /**
     * @OA\Post(path="/users", tags={"Utilisateurs"}, summary="Créer un utilisateur (super_admin)",
     *     security={{"bearerAuth":{}}},
     *     @OA\RequestBody(required=true, @OA\JsonContent(
     *         required={"email","password","first_name","last_name","role","scope_type"},
     *         @OA\Property(property="email", type="string", format="email"),
     *         @OA\Property(property="password", type="string"),
     *         @OA\Property(property="first_name", type="string"),
     *         @OA\Property(property="last_name", type="string"),
     *         @OA\Property(property="role", type="string", enum={"super_admin","admin","manager","user"}),
     *         @OA\Property(property="scope_type", type="string", enum={"national","regional","departemental","arrondissement"}),
     *         @OA\Property(property="region_id", type="integer"),
     *         @OA\Property(property="departement_id", type="integer"),
     *         @OA\Property(property="arrondissement_id", type="integer")
     *     )),
     *     @OA\Response(response=201, description="Utilisateur créé")
     * )
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|unique:users',
            'password' => 'required|min:6',
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'role' => 'required|in:super_admin,admin,manager,user',
            'scope_type' => 'required|in:national,regional,departemental,arrondissement',
            'region_id' => 'nullable|exists:regions,id',
            'departement_id' => 'nullable|exists:departements,id',
            'arrondissement_id' => 'nullable|exists:arrondissements,id',
        ]);

        if ($validator->fails()) return $this->errorResponse('Erreur de validation', 422, $validator->errors());

        $user = User::create($validator->validated());
        $this->auditService->logCreate($request->user(), 'users', $user->id, $user->toArray(), $request);

        return $this->successResponse($user->load(['region', 'departement', 'arrondissement']), 'Utilisateur créé', 201);
    }

    /**
     * @OA\Put(path="/users/{id}", tags={"Utilisateurs"}, summary="Modifier un utilisateur (super_admin)",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\RequestBody(required=true, @OA\JsonContent()),
     *     @OA\Response(response=200, description="Utilisateur mis à jour")
     * )
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $user = User::find($id);
        if (!$user) return $this->errorResponse('Utilisateur non trouvé', 404);

        $validator = Validator::make($request->all(), [
            'email' => "nullable|email|unique:users,email,{$id}",
            'password' => 'nullable|min:6',
            'first_name' => 'nullable|string|max:255',
            'last_name' => 'nullable|string|max:255',
            'role' => 'nullable|in:super_admin,admin,manager,user',
            'scope_type' => 'nullable|in:national,regional,departemental,arrondissement',
            'region_id' => 'nullable|exists:regions,id',
            'departement_id' => 'nullable|exists:departements,id',
            'arrondissement_id' => 'nullable|exists:arrondissements,id',
            'is_active' => 'nullable|boolean',
        ]);

        if ($validator->fails()) return $this->errorResponse('Erreur de validation', 422, $validator->errors());

        $old = $user->toArray();
        $user->update(array_filter($validator->validated(), fn ($v) => $v !== null));
        $this->auditService->logUpdate($request->user(), 'users', $id, $old, $user->fresh()->toArray(), $request);

        return $this->successResponse($user->fresh()->load(['region', 'departement', 'arrondissement']), 'Utilisateur mis à jour');
    }

    /**
     * @OA\Delete(path="/users/{id}", tags={"Utilisateurs"}, summary="Supprimer un utilisateur (super_admin)",
     *     security={{"bearerAuth":{}}},
     *     @OA\Parameter(name="id", in="path", required=true, @OA\Schema(type="integer")),
     *     @OA\Response(response=200, description="Utilisateur supprimé")
     * )
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $user = User::find($id);
        if (!$user) return $this->errorResponse('Utilisateur non trouvé', 404);

        $this->auditService->logDelete($request->user(), 'users', $id, $user->toArray(), $request);
        $user->delete();

        return $this->successResponse(null, 'Utilisateur supprimé');
    }
}
