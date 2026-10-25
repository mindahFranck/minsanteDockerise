<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AuthService;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

/**
 * @OA\Tag(name="Authentification", description="Gestion de l'authentification JWT")
 */
class AuthController extends Controller
{
    public function __construct(
        protected AuthService $authService,
        protected AuditService $auditService
    ) {}

    /**
     * @OA\Post(path="/auth/register", tags={"Authentification"}, summary="Inscription d'un utilisateur",
     *     @OA\RequestBody(required=true, @OA\JsonContent(
     *         required={"email","password","password_confirmation","first_name","last_name"},
     *         @OA\Property(property="email", type="string", format="email"),
     *         @OA\Property(property="password", type="string", minLength=6),
     *         @OA\Property(property="password_confirmation", type="string"),
     *         @OA\Property(property="first_name", type="string"),
     *         @OA\Property(property="last_name", type="string")
     *     )),
     *     @OA\Response(response=201, description="Utilisateur créé"),
     *     @OA\Response(response=422, description="Erreur de validation")
     * )
     */
    public function register(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|unique:users',
            'password' => 'required|min:6|confirmed',
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
        ]);

        if ($validator->fails()) {
            return $this->errorResponse('Erreur de validation', 422, $validator->errors());
        }

        $result = $this->authService->register($validator->validated());

        return $this->successResponse($result, 'Inscription réussie', 201);
    }

    /**
     * @OA\Post(path="/auth/login", tags={"Authentification"}, summary="Connexion",
     *     @OA\RequestBody(required=true, @OA\JsonContent(
     *         required={"email","password"},
     *         @OA\Property(property="email", type="string", format="email"),
     *         @OA\Property(property="password", type="string")
     *     )),
     *     @OA\Response(response=200, description="Connexion réussie"),
     *     @OA\Response(response=401, description="Identifiants invalides")
     * )
     */
    public function login(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required',
        ]);

        if ($validator->fails()) {
            return $this->errorResponse('Erreur de validation', 422, $validator->errors());
        }

        $result = $this->authService->login($request->email, $request->password);

        if (!$result) {
            $this->auditService->logLoginFailure($request->email, $request);
            return $this->errorResponse('Identifiants invalides', 401);
        }

        $this->auditService->logLogin($result['user'], $request);

        return $this->successResponse($result, 'Connexion réussie');
    }

    /**
     * @OA\Get(path="/auth/me", tags={"Authentification"}, summary="Profil de l'utilisateur connecté",
     *     security={{"bearerAuth":{}}},
     *     @OA\Response(response=200, description="Profil utilisateur")
     * )
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user()->load(['region', 'departement', 'arrondissement']);
        return $this->successResponse($user);
    }

    /**
     * @OA\Post(path="/auth/refresh", tags={"Authentification"}, summary="Rafraîchir le token JWT",
     *     security={{"bearerAuth":{}}},
     *     @OA\Response(response=200, description="Token rafraîchi")
     * )
     */
    public function refresh(): JsonResponse
    {
        $token = $this->authService->refreshToken();

        return $this->successResponse([
            'token' => $token,
            'token_type' => 'bearer',
            'expires_in' => config('jwt.ttl') * 60,
        ], 'Token rafraîchi');
    }

    /**
     * @OA\Put(path="/auth/password", tags={"Authentification"}, summary="Changer le mot de passe",
     *     security={{"bearerAuth":{}}},
     *     @OA\RequestBody(required=true, @OA\JsonContent(
     *         required={"current_password","new_password","new_password_confirmation"},
     *         @OA\Property(property="current_password", type="string"),
     *         @OA\Property(property="new_password", type="string", minLength=6),
     *         @OA\Property(property="new_password_confirmation", type="string")
     *     )),
     *     @OA\Response(response=200, description="Mot de passe modifié"),
     *     @OA\Response(response=400, description="Mot de passe actuel incorrect")
     * )
     */
    public function changePassword(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'current_password' => 'required',
            'new_password' => 'required|min:6|confirmed',
        ]);

        if ($validator->fails()) {
            return $this->errorResponse('Erreur de validation', 422, $validator->errors());
        }

        $success = $this->authService->changePassword(
            $request->user(),
            $request->current_password,
            $request->new_password
        );

        if (!$success) {
            return $this->errorResponse('Mot de passe actuel incorrect', 400);
        }

        return $this->successResponse(null, 'Mot de passe modifié avec succès');
    }

    /**
     * @OA\Post(path="/auth/logout", tags={"Authentification"}, summary="Déconnexion",
     *     security={{"bearerAuth":{}}},
     *     @OA\Response(response=200, description="Déconnecté")
     * )
     */
    public function logout(): JsonResponse
    {
        $this->authService->logout();
        return $this->successResponse(null, 'Déconnexion réussie');
    }
}
