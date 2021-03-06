import "./modifiers/modifier_visible_through_fog"
import "./modifiers/modifier_tutorial_pacifist"
import "./modifiers/modifier_dummy"
import "./modifiers/modifier_particle_attach"
import { TutorialContext } from "./TutorialGraph/Core";

let respawnListener: EventListenerID | undefined

/**
 * Get a list of all valid players currently in the game.
 */
export function findAllPlayersID(): PlayerID[] {
    const players: PlayerID[] = [];

    for (let playerID = 0; playerID < DOTA_MAX_TEAM_PLAYERS; playerID++) {
        if (PlayerResource.IsValidPlayer(playerID)) {
            players.push(playerID);
        }
    }

    return players;
}

/**
 * Get the player ID of the real player in the game.
 */
export function findRealPlayerID(): PlayerID {
    let playerIDs = findAllPlayersID();
    const realPlayerID = playerIDs.filter(playerID => !PlayerResource.IsFakeClient(playerID))[0];

    return realPlayerID;
}

/**
 * @returns The player's hero of the real player in the game.
 */
export function getPlayerHero(): CDOTA_BaseNPC_Hero | undefined {
    return GameRules.Addon.playerHero;
}

/**
 * Set whether the player hero can earn XP from all sources. Defaults to false.
 */
export function setCanPlayerHeroEarnXP(canEarnXP: boolean) {
    GameRules.Addon.canPlayerHeroEarnXP = canEarnXP;
}

/**
 * Check if the hero can currently earn XP from all sources.
 * @returns whether the hero can currently earn XP.
 */
export function canPlayerHeroEarnXP(): boolean {
    return GameRules.Addon.canPlayerHeroEarnXP;
}

/**
 * Sets whether a unit can be shown through the fog of war.
 */
export function setUnitVisibilityThroughFogOfWar(unit: CDOTA_BaseNPC, visible: boolean) {
    if (visible) {
        unit.AddNewModifier(undefined, undefined, "modifier_visible_through_fog", {});
    }
    else {
        unit.RemoveModifierByName("modifier_visible_through_fog");
    }
}

export function setUnitPacifist(unit: CDOTA_BaseNPC, isPacifist: boolean, duration?: number) {
    if (isPacifist) {
        unit.AddNewModifier(undefined, undefined, "modifier_tutorial_pacifist", { duration: duration });
    }
    else {
        unit.RemoveModifierByName("modifier_tutorial_pacifist");
    }
}

/**
 * Whether the player hero is currently frozen using freezePlayerHero().
 */
let playerHeroFrozen = false;

/**
 * Returns whether the player hero is currently frozen using freezePlayerHero().
 * @returns Whether the player hero is currently frozen.
 */
export function isPlayerHeroFrozen() {
    return playerHeroFrozen;
}

/**
 * Makes the player hero (un-)able to attack and move.
 * @param frozen Whether or not to freeze the hero.
 */
export function freezePlayerHero(frozen: boolean) {
    const hero = getOrError(getPlayerHero(), "Could not find player hero");
    setUnitPacifist(hero, frozen);
    if (frozen) {
        hero.Stop();
    }
    hero.SetMoveCapability(frozen ? UnitMoveCapability.NONE : UnitMoveCapability.GROUND);
    playerHeroFrozen = frozen;
}

/**
 * Freezes time and puts all units into the idle animation. This doesn't literally
 * pause the game, but it effectively does.
 */
export function setGameFrozen(freeze: boolean) {
    Tutorial.SetTimeFrozen(freeze);
    let entity: CBaseEntity | undefined = Entities.First();
    while (entity !== undefined) {
        if (entity.IsBaseNPC()) {
            if (entity.IsAlive() && entity.IsCreep() || entity.IsHero()) {
                if (freeze) {
                    entity.StartGesture(GameActivity.DOTA_IDLE);
                } else {
                    entity.RemoveGesture(GameActivity.DOTA_IDLE);
                }
            }
        }
        entity = Entities.Next(entity);
    }
}

/*
 * Returns the object if it is not undefined or calls error.
 * @param obj Object to check and return.
 * @param msg Optional message to pass for error.
 */
export function getOrError<T>(obj: T | undefined, msg?: string): T {
    if (obj === undefined) {
        error(msg ?? "Object was undefined")
    }

    return obj
}

/** Updates the goal display.
  * @param goals Goals to display in the UI.
  */
export function setGoalsUI(goals: Goal[]) {
    CustomGameEventManager.Send_ServerToAllClients("set_goals", { goals });
}
/*
 * Destroy all neutrals on the map
*/
export function DestroyNeutrals() {
    const units = Entities.FindAllByClassname("npc_dota_creep_neutral") as CDOTA_BaseNPC[];
    units.filter(x => x.GetTeamNumber() == DotaTeam.NEUTRALS && !x.IsInvulnerable());
    units.forEach(x => x.Destroy());
}

/**
 * Prints all key values of an event. (though it actually would work on any array, I guess)
 * @param event An event that should be printed.
 */
export function printEventTable(event: any) {
    for (const key in event) {
        print(key, event[key])
    }
}

/**
 * Shows a "dota" error message to the player.
 * @param message The error message that should be shown to the player.
 */
export function displayDotaErrorMessage(message: string) {
    FireGameEvent("dota_hud_error_message", { reason: 80, message: message })
}

/**
 * Highlights a panel along a path
 * @param path The path along the ui to take, such as "HUDElements/lower_hud/center_with_stats/center_block/inventory"
 * @param duration Optional time in seconds after which to remove the highlight
 */
export function highlightUiElement(path: string, duration?: number) {
    CustomGameEventManager.Send_ServerToAllClients("highlight_element", { path, duration });
}

/**
 * Manually removes a highlighted panel, along the path, if it exists
 * @param path The path along the ui to take, such as "HUDElements/lower_hud/center_with_stats/center_block/inventory"
 */
export function removeHighlight(path: string) {
    CustomGameEventManager.Send_ServerToAllClients("remove_highlight", { path });
}

export function isCustomLaneCreepUnit(unit: CDOTA_BaseNPC): boolean {
    if (unit.GetUnitName() === CustomNpcKeys.RadiantMeleeCreep ||
        unit.GetUnitName() === CustomNpcKeys.RadiantRangedCreep ||
        unit.GetUnitName() === CustomNpcKeys.DireMeleeCreep ||
        unit.GetUnitName() === CustomNpcKeys.DireRangedCreep)

        return true

    else return false
}

/**
 * Spawns an untargetable, invisible dummy unit.
 * @param location Location to spawn the dummy at.
 */
export function createDummy(location: Vector) {
    const dummy = CreateUnitByName("npc_dummy_unit", GetGroundPosition(location, undefined), false, undefined, undefined, DotaTeam.GOODGUYS)
    dummy.AddNewModifier(dummy, undefined, "modifier_dummy", {})
    return dummy
}

let cameraDummy: CDOTA_BaseNPC | undefined = undefined

/**
 * Gets the camera dummy and positions it at a given location. If the dummy doesn't already exist it will be created.
 * @param location Location to position the camera dummy at.
 * @returns Camera dummy
 */
export function getCameraDummy(location: Vector) {
    if (cameraDummy && unitIsValidAndAlive(cameraDummy)) {
        cameraDummy.SetAbsOrigin(location)
    } else {
        cameraDummy = createDummy(location)
    }

    return cameraDummy
}

/**
 * Orders a unit to use an ability.
 * @param caster Unit that will use the ability.
 * @param target Target of the ability.
 * @param abilityName Name of the ability.
 * @param orderType Type of unit order used for casting the ability with ExecuteOrderFromTable.
 */
export const useAbility = (caster: CDOTA_BaseNPC, target: CDOTA_BaseNPC | Vector, abilityName: string, orderType: UnitOrder) => {
    const ability = caster.FindAbilityByName(abilityName) as CDOTABaseAbility

    let order: ExecuteOrderOptions = {
        UnitIndex: caster.GetEntityIndex(),
        OrderType: orderType,
        AbilityIndex: ability.GetEntityIndex(),
        Queue: true
    };

    if (typeof target === typeof CDOTA_BaseNPC) {
        if (orderType === UnitOrder.CAST_TARGET)
            order.TargetIndex = (target as CDOTA_BaseNPC).GetEntityIndex()
        else
            order.Position = (target as CDOTA_BaseNPC).GetAbsOrigin()
    } else {
        order.Position = (target as Vector)
    }

    ExecuteOrderFromTable(order)
}

export function removeContextEntityIfExists(context: TutorialContext, entityKey: keyof TutorialContext) {
    const entity = context[entityKey];

    if (entity) {
        if (Array.isArray(entity)) {
            for (const entityInstance of entity) {
                if (IsValidEntity(entityInstance)) {
                    UTIL_Remove(entityInstance)
                }
            }
        }
        else {
            if (IsValidEntity(entity)) {
                UTIL_Remove(entity);
            }
        }
        context[entityKey] = undefined;
    }
}

/**
 * Returns whether a passed unit is a valid entity and alive.
 * @param unit Unit to check.
 */
export function unitIsValidAndAlive(unit: CDOTA_BaseNPC | undefined): boolean {
    return unit !== undefined && IsValidEntity(unit) && unit.IsAlive()
}

/**
 * Returns the path to an item located in the guide, to the left of the shop.
 * @param itemID The ID of the item, as defined by Valve's items.txt, e.g. "ID" "44"
 */
export function getPathToItemInGuideByID(itemID: number): string {
    return "HUDElements/shop/GuideFlyout/ItemsArea/ItemBuildContainer/ItemBuild/Categories/ItemList/Item" + itemID;
}

export function createPathParticle(locations: Vector[]): ParticleID {
    const particle = ParticleManager.CreateParticle(ParticleName.Path, ParticleAttachment.CUSTOMORIGIN, undefined)

    for (let i = 0; i < locations.length; i++) {
        ParticleManager.SetParticleControl(particle, i, locations[i])
    }
    ParticleManager.SetParticleControl(particle, 61, Vector(locations.length, 0, 0))

    ParticleManager.SetParticleShouldCheckFoW(particle, false)

    return particle
}

/**
 * Creates a particle at a location.
 * @param particleName Name of the particle.
 * @param location Location to spawn the particle at.
 * @returns The created particle.
 */
export const createParticleAtLocation = (particleName: string, location: Vector) => {
    const particle = ParticleManager.CreateParticle(particleName, ParticleAttachment.CUSTOMORIGIN, undefined)
    ParticleManager.SetParticleControl(particle, 0, location)
    return particle
}

/**
 * Creates a particle attached to a unit.
 * @param particleName Name of the particle.
 * @param unit Unit to attach the particle to.
 * @param attachPoint Optional parameter for where and how to attach the particle.
 * @returns The created particle.
 */
export const createParticleAttachedToUnit = (particleName: string, unit: CDOTA_BaseNPC, attach: ParticleAttachment = ParticleAttachment.ABSORIGIN_FOLLOW) => {
    const particleID = ParticleManager.CreateParticle(particleName, attach, unit)
    const modifier = unit.AddNewModifier(undefined, undefined, "modifier_particle_attach", {})
    if (modifier) {
        modifier.AddParticle(particleID, false, false, -1, false, false);
    }

    return particleID;
}
export type HighlightType = "circle" | "arrow" | "arrow_enemy" | "dialog_circle"

type HighlightParticleDescriptor = {
    name: string // Particle name
    attach?: ParticleAttachment // Attach method when attached to a unit. Default ABSORIGIN_FOLLOW
    offset?: Vector // Location offset when not attached to a unit. Default zero.
}

const highlightTypeParticleNames: Record<HighlightType, HighlightParticleDescriptor[]> = {
    "circle": [
        { name: ParticleName.HighlightCircle },
    ],
    "arrow": [
        { name: ParticleName.HighlightOrangeCircle },
        { name: ParticleName.HighlightOrangeArrow, attach: ParticleAttachment.OVERHEAD_FOLLOW, offset: Vector(0, 0, 50) },
    ],
    "arrow_enemy": [
        { name: ParticleName.HighlightRedCircle },
        { name: ParticleName.HighlightRedArrow, attach: ParticleAttachment.OVERHEAD_FOLLOW, offset: Vector(0, 0, 50) },
    ],
    "dialog_circle": [
        { name: ParticleName.DialogCircle },
    ],
}

/**
 * Highlight data.
 */
export type HighlightProps = {
    /**
     * Type of highlight.
     */
    type: HighlightType

    /**
     * Units to highlight.
     */
    units?: CDOTA_BaseNPC[]

    /**
     * Locations to highlight.
     */
    locations?: Vector[]

    /**
     * Radius of the highlight if using circle.
     */
    radius?: number

    /**
     * Whether the unit particles should be attached to the unit or only using its ground location. Defaults to true.
     */
    attach?: boolean
}

/**
 * Creates particle highlights.
 * @param props Properties describing the desired highlights.
 * @returns Particles created for the highlights.
 */
export function highlight(props: HighlightProps): ParticleID[] {
    const { type, units, locations, radius, attach } = props

    const particleDescriptors = highlightTypeParticleNames[type]

    const particles: ParticleID[] = []

    for (const desc of particleDescriptors) {
        // Create unit highlights
        if (units) {
            for (const unit of units) {
                particles.push(attach !== false ?
                    createParticleAttachedToUnit(desc.name, unit, desc.attach ?? ParticleAttachment.ABSORIGIN_FOLLOW) :
                    createParticleAtLocation(desc.name, GetGroundPosition(unit.GetAbsOrigin(), undefined).__add(desc.offset ?? Vector(0, 0, 0)))
                )
            }
        }

        // Create location highlights
        if (locations) {
            for (const location of locations) {
                particles.push(createParticleAtLocation(desc.name, GetGroundPosition(location, undefined).__add(desc.offset ?? Vector(0, 0, 0))))
            }
        }
    }

    particles.forEach(particle => {
        ParticleManager.SetParticleShouldCheckFoW(particle, false)

        if (radius) {
            ParticleManager.SetParticleControl(particle, 1, Vector(radius, 0, 0))
        }
    })

    return particles
}

/**
 * Removes all attached particle modifiers from the supplied units.
 * @param units The units to remove the particle modifiers from.
 */
export function clearAttachedHighlightParticlesFromUnits(units: CDOTA_BaseNPC[]) {
    for (const unit of units) {
        if (unit.HasModifier("modifier_particle_attach")) {
            const modifiers = unit.FindAllModifiersByName("modifier_particle_attach")
            if (modifiers) {
                for (const modifier of modifiers) {
                    modifier.Destroy()
                }
            }
        }
    }
}


/**
 * Returns the current camera location (technically the target, not the origin) of the player.
 * @returns Current camera location of the player.
 */
export function getPlayerCameraLocation() {
    const playerHero = getOrError(getPlayerHero(), "Could not get player hero");
    const owner = playerHero.GetOwner();
    if (!owner || !IsValidEntity(owner)) {
        error("Could not get player hero owner");
    }

    const cameraOrigin = owner.GetAbsOrigin();
    const cameraForward = owner.GetAngles().Forward();

    // Assume fixed camera distance stored in dota_camera_distance
    const cameraDistance = cvar_getf("dota_camera_distance");

    return GetGroundPosition(cameraOrigin.__add(cameraForward.__mul(cameraDistance)), undefined);
}

/**
 * Centers the camera on the player's hero. Does not lock the camera.
 */
export function centerCameraOnHero() {
    const playerHero = getOrError(getPlayerHero(), "Could not get player hero");
    CenterCameraOnUnit(playerHero.GetPlayerOwnerID(), playerHero);
}

/**
 * Sets the player's respawn settings.
 * @param respawnLocation The location the player should respawn at.
 * @param respawnTime How long it should take the player to respawn.
 */
export function setRespawnSettings(respawnLocation: Vector, respawnTime: number) {
    if (respawnListener) {
        StopListeningToGameEvent(respawnListener)
        respawnListener = undefined;
    }

    respawnListener = ListenToGameEvent("entity_killed", event => {
        const hero = getPlayerHero()
        const killed = EntIndexToHScript(event.entindex_killed) as CDOTA_BaseNPC_Hero

        if (killed === hero) {
            killed.SetRespawnPosition(respawnLocation)
            killed.SetTimeUntilRespawn(respawnTime)
        }
    }, GameRules.Addon)
}


/**
 * Calculates the distance in 2D between two points.
 * @returns The distance between the two points.
 */
export function Distance2D(point1: Vector, point2: Vector): number {
    return ((point1 - point2) as Vector).Length2D()
}

/**
 * Calculates the direction from the first position to the second.
 * @param origin_pos The position where the vector should originate from.
 * @param towards_pos The position where the vector should point.
 * @returns The normalized vector pointing towards the second vector argument.
 */
export function DirectionToPosition(origin_pos: Vector, towards_pos: Vector): Vector {
    return ((towards_pos - origin_pos) as Vector).Normalized();
}

export function removeNeutralSpawners() {
    //const creepSpawnLocationToKeep = Entities.FindAllByClassnameWithin("npc_dota_neutral_spawner",Vector(-2464,4816,170),500)[0];
    const spawners = Entities.FindAllByClassname("npc_dota_neutral_spawner");
    for (const spawner of spawners) {
        let normal = spawner.GetAbsOrigin() - Vector(-2464, 4816, 170) as Vector
        if (normal.Length2D() > 100) {
            UTIL_Remove(spawner);
        }

    }
}

/**
 * Returns a random item from an array
 * @param choices Array to choose from.
 * @returns Randomly chosen item from the given array.
 */
export function randomChoice<T>(choices: T[]) {
    if (choices.length === 0) {
        error("randomChoice called with empty array")
    }

    return choices[RandomInt(0, choices.length - 1)]
}
