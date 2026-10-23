/* Gameplay facts selected from the original game data (numbers, shapes, timings, bindings). */
window.SLS_FACTS = {
 "physics": {
  "gravity": {
   "x": 0.0,
   "y": -9.81
  },
  "fixedTimestep": 0.02
 },
 "camera": {
  "orthoSize": 5.0,
  "x": 0.01,
  "y": 0.0
 },
 "screen": {
  "width": 1920,
  "height": 1080
 },
 "arena": {
  "walls": [
   {
    "name": "Wall1 (1)",
    "cx": -8.287726,
    "cy": 4.862336,
    "w": 0.304616,
    "h": 0.087745,
    "active": false
   },
   {
    "name": "Wall1 (2)",
    "cx": 8.306271,
    "cy": 4.908145,
    "w": 0.304616,
    "h": 0.087763,
    "active": false
   },
   {
    "name": "Wall1",
    "cx": -8.452387,
    "cy": 21.674189,
    "w": 0.068896,
    "h": 47.86974,
    "active": true
   },
   {
    "name": "Wall2",
    "cx": 8.485613,
    "cy": 21.674189,
    "w": 0.072608,
    "h": 47.879318,
    "active": true
   }
  ],
  "groundPolygon": [
   [
    8.536308,
    -1.49323
   ],
   [
    8.483893,
    -1.519291
   ],
   [
    7.993073,
    -1.528281
   ],
   [
    7.989894,
    -1.999927
   ],
   [
    7.313668,
    -1.995644
   ],
   [
    7.311293,
    -2.524975
   ],
   [
    6.739758,
    -2.527901
   ],
   [
    6.734985,
    -3.052056
   ],
   [
    6.160542,
    -3.055558
   ],
   [
    6.155736,
    -3.572218
   ],
   [
    5.634068,
    -3.575544
   ],
   [
    5.631022,
    -4.043855
   ],
   [
    -1.470304,
    -4.047273
   ],
   [
    -1.458153,
    -3.520853
   ],
   [
    -1.995871,
    -3.525955
   ],
   [
    -1.986781,
    -3.048754
   ],
   [
    -2.454665,
    -3.049236
   ],
   [
    -2.454562,
    -2.524894
   ],
   [
    -4.559444,
    -2.530032
   ],
   [
    -4.549992,
    -3.052458
   ],
   [
    -5.49641,
    -3.064679
   ],
   [
    -5.497904,
    -3.519517
   ],
   [
    -6.339546,
    -3.527646
   ],
   [
    -6.328831,
    -3.052681
   ],
   [
    -6.803851,
    -3.053262
   ],
   [
    -6.795343,
    -2.528469
   ],
   [
    -7.384147,
    -2.525324
   ],
   [
    -7.369853,
    -2.006892
   ],
   [
    -7.952819,
    -2.003231
   ],
   [
    -7.956881,
    -1.478791
   ],
   [
    -8.448566,
    -1.474182
   ],
   [
    -8.817994,
    -1.472024
   ],
   [
    -9.572626,
    -1.497081
   ],
   [
    -9.605286,
    -5.472516
   ],
   [
    9.698345,
    -5.363486
   ],
   [
    9.600868,
    -1.492986
   ]
  ],
  "blocks": [
   {
    "name": "GroundBlock",
    "cx": -3.746487,
    "cy": -3.776811,
    "w": 4.5055,
    "h": 0.5,
    "active": false
   },
   {
    "name": "GroundBlock (12)",
    "cx": 8.160833,
    "cy": -2.279811,
    "w": 1.654706,
    "h": 0.52485,
    "active": false
   },
   {
    "name": "GroundBlock (10)",
    "cx": 8.102303,
    "cy": -3.327411,
    "w": 3.866217,
    "h": 0.52485,
    "active": false
   },
   {
    "name": "GroundBlock (3)",
    "cx": -8.105787,
    "cy": -3.776811,
    "w": 4.5055,
    "h": 0.5,
    "active": false
   },
   {
    "name": "GroundBlock (7)",
    "cx": -8.441587,
    "cy": -1.735811,
    "w": 0.899378,
    "h": 0.52485,
    "active": false
   },
   {
    "name": "GroundBlock (11)",
    "cx": 7.854213,
    "cy": -2.805811,
    "w": 2.267884,
    "h": 0.52485,
    "active": false
   },
   {
    "name": "GroundBlock (9)",
    "cx": 8.11749,
    "cy": -3.820811,
    "w": 4.994347,
    "h": 0.5,
    "active": false
   },
   {
    "name": "GroundBlock (2)",
    "cx": -3.508987,
    "cy": -2.761811,
    "w": 2.045904,
    "h": 0.52485,
    "active": false
   },
   {
    "name": "GroundBlock (1)",
    "cx": -3.732787,
    "cy": -3.283411,
    "w": 3.487792,
    "h": 0.52485,
    "active": false
   },
   {
    "name": "GroundBlock (6)",
    "cx": -8.144887,
    "cy": -2.235811,
    "w": 1.492743,
    "h": 0.52485,
    "active": false
   },
   {
    "name": "GroundBlock",
    "cx": 0.001013,
    "cy": -4.565111,
    "w": 17.91123,
    "h": 1.0986,
    "active": false
   },
   {
    "name": "GroundBlock (13)",
    "cx": 8.489736,
    "cy": -1.779811,
    "w": 0.99696,
    "h": 0.52485,
    "active": false
   },
   {
    "name": "GroundBlock (5)",
    "cx": -7.868287,
    "cy": -2.761811,
    "w": 2.045904,
    "h": 0.52485,
    "active": false
   },
   {
    "name": "GroundBlock (4)",
    "cx": -8.092087,
    "cy": -3.283411,
    "w": 3.487792,
    "h": 0.52485,
    "active": false
   }
  ],
  "visualAnchors": {
   "Background": {
    "x": 0.0,
    "y": 0.0,
    "sx": 1.0,
    "sy": 1.0
   },
   "GroundRemake": {
    "x": -0.005787,
    "y": 0.934189,
    "sx": 3.55,
    "sy": 3.55
   },
   "Ground": {
    "x": -0.005787,
    "y": -0.015811,
    "sx": 5.23,
    "sy": 5.23
   }
  },
  "spawnArea": {
   "x": -0.1,
   "y": 1.0
  }
 },
 "player": {
  "transform": {
   "pos": {
    "x": 0.0,
    "y": -3.54,
    "z": 0.0
   },
   "scale": {
    "x": 0.63,
    "y": 0.63,
    "z": 0.63
   },
   "rotZ": 0.0
  },
  "scripts": {
   "PlayerController": {
    "mobile_controls": false,
    "mobile_axis": 0.0,
    "thunder_aim_speed": 5.0,
    "projectile": {
     "prefab": "Projectile"
    },
    "fragment_projectile": {
     "prefab": "Projectile_Fragment"
    },
    "thunder_projectile": {
     "prefab": "Thunderbolt"
    },
    "friction_projectile": {
     "prefab": "FrictionProjectile"
    },
    "is_grounded": false,
    "checkGroundRadius": 0.12,
    "groundLayer": 8,
    "thunder_cooldown": 8.0,
    "atk_speed_before": 0.0,
    "walked_distance": 0.0,
    "time_to_fall": 0.0,
    "comet_object": {
     "prefab": "CometExplosion"
    },
    "staffAngle": 0.0
   },
   "PlayerStats": {
    "isAlive": false,
    "speed": 1.0,
    "speed_stacks": 0,
    "atk_speed": 0.9,
    "atk_speed_stacks": 0,
    "atk_damage": 2.0,
    "atk_stacks": 0,
    "critical_chance": 0.0,
    "critical_multiplier": 1.5,
    "life_steal": 0.0,
    "max_hp": 25.0,
    "hp": 0.0,
    "hp_stacks": 0,
    "hp_regen": 0.0,
    "renew_stacks": 0.0,
    "armor": 0.0,
    "armor_stacks": 0,
    "revive_count": 0,
    "revive_cd": 0,
    "i_window": 0.3,
    "cloak_count": 0,
    "jump_force": 4.0,
    "impulse_stacks": 0,
    "proj_size": 1.0,
    "proj_fragments": 0.0,
    "body_damage": 0.0,
    "proj_hits": 2,
    "jump_number": 0,
    "projectile_acceleration": 1.0,
    "thunder_projs": 0,
    "cards_plus": 1,
    "shield_lvl": 0,
    "shield_up": false,
    "healing_orb_lvl": 0,
    "orb_charge": 0,
    "focus_lvl": 0,
    "tome_lvl": 0.0,
    "friction_lvl": 0,
    "rage_lvl": 0,
    "rage_damage": 0.0,
    "rage_body_damage": 0.0,
    "wound_lvl": 0,
    "willo_lvl": 0,
    "willowisp": {
     "prefab": "WIllowisp"
    },
    "shrink_lvl": 0,
    "soul_orb_level": 0,
    "charge_stacks": 0,
    "cold_lvl": 0,
    "thundergod": false,
    "vampire": false,
    "ram_destroyer": false,
    "bloody_mage": false,
    "anti_air": false,
    "flying": false,
    "colossus": false,
    "gnome": false,
    "hoarder": false,
    "protector": false,
    "sadistic": false,
    "marksman": false,
    "dealer": false,
    "blessed": false,
    "white_dwarf": false,
    "burning_man": false,
    "exorcist": false,
    "comet": false,
    "streamer": false,
    "pacman": false,
    "absorbent": false,
    "plague_spreader": false,
    "speculator": false,
    "bunker": false,
    "desperate": false,
    "enchanter": false,
    "avenger": false,
    "nerd": false,
    "tryhard": false,
    "bulldozer": false,
    "freezer": false,
    "i_window_timer": 0.0,
    "shield_cooldown": 0.0,
    "black_hole_cooldown": 1.0,
    "staff": 0,
    "projetctile_normal": {
     "prefab": "Projectile"
    },
    "projetctile_homing": {
     "prefab": "Projectile_Homing"
    },
    "projetctile_triple": {
     "prefab": "Projectile_Triple"
    },
    "projectile_explosive": {
     "prefab": "ExplosiveProjectile"
    },
    "projectile_pierce": {
     "prefab": "Projectile_Piercing"
    },
    "hat": 0
   }
  },
  "colliders": [
   {
    "kind": "box",
    "trigger": false,
    "enabled": true,
    "offset": {
     "x": -0.004094,
     "y": -0.052815
    },
    "size": {
     "x": 0.419519,
     "y": 0.89437
    }
   }
  ],
  "body": {
   "type": "dynamic",
   "mass": 1.0,
   "gravityScale": 2.75,
   "drag": 0.0,
   "constraints": 4,
   "material": {
    "friction": 0.0,
    "bounciness": 0.0
   }
  },
  "children": {
   "Shield": {
    "transform": {
     "pos": {
      "x": 0.023,
      "y": 0.166,
      "z": 0.0
     },
     "scale": {
      "x": 1.106601,
      "y": 1.575857,
      "z": 1.106601
     },
     "rotZ": 0.0
    }
   },
   "Graphics": {
    "transform": {
     "pos": {
      "x": 0.0,
      "y": 0.21,
      "z": 0.0
     },
     "scale": {
      "x": 3.3,
      "y": 3.3,
      "z": 1.0
     },
     "rotZ": 0.0
    }
   },
   "Helmet": {
    "transform": {
     "pos": {
      "x": 0.0,
      "y": 0.21,
      "z": 0.0
     },
     "scale": {
      "x": 3.3,
      "y": 3.3,
      "z": 1.0
     },
     "rotZ": 0.0
    }
   },
   "Staff": {
    "transform": {
     "pos": {
      "x": 0.033,
      "y": 0.037,
      "z": 0.0
     },
     "scale": {
      "x": 2.4,
      "y": 2.3,
      "z": 1.0
     },
     "rotZ": 90.0
    }
   },
   "Staff/Point": {
    "transform": {
     "pos": {
      "x": 0.44,
      "y": -0.001,
      "z": 0.0
     },
     "scale": {
      "x": 0.1,
      "y": 0.1,
      "z": 0.7341
     },
     "rotZ": 0.0
    }
   },
   "Staff/Point/StreamerBeam": {
    "transform": {
     "pos": {
      "x": 2.330003,
      "y": 0.07,
      "z": 0.0
     },
     "scale": {
      "x": 0.2,
      "y": 100.0,
      "z": 1.362212
     },
     "rotZ": -89.999838
    }
   },
   "Staff/Point/StreamerBeam/Graphics": {
    "transform": {
     "pos": {
      "x": 0.0,
      "y": 0.42999,
      "z": 0.0
     },
     "scale": {
      "x": 1.0,
      "y": 1.281641,
      "z": 1.0
     },
     "rotZ": 0.0
    }
   },
   "Staff/Point/StreamerBeam/Particle System": {
    "transform": {
     "pos": {
      "x": 0.0,
      "y": 0.0,
      "z": 0.0
     },
     "scale": {
      "x": 1.0,
      "y": 1.0,
      "z": 1.0
     },
     "rotZ": 0.0
    }
   },
   "Staff/Aim": {
    "transform": {
     "pos": {
      "x": 0.0,
      "y": 0.0,
      "z": 0.0
     },
     "scale": {
      "x": 1.0,
      "y": 1.0,
      "z": 1.0
     },
     "rotZ": 270.0
    }
   },
   "Staff/Aim/AimFinal": {
    "transform": {
     "pos": {
      "x": 0.0,
      "y": 2.4,
      "z": 0.0
     },
     "scale": {
      "x": 0.5,
      "y": 0.5,
      "z": 1.0
     },
     "rotZ": 0.0
    }
   },
   "GroundChecker1": {
    "transform": {
     "pos": {
      "x": -0.214,
      "y": -0.46,
      "z": 0.0
     },
     "scale": {
      "x": 1.0,
      "y": 1.0,
      "z": 1.0
     },
     "rotZ": 0.0
    }
   },
   "GroundChecker2": {
    "transform": {
     "pos": {
      "x": 0.209,
      "y": -0.46,
      "z": 0.0
     },
     "scale": {
      "x": 1.0,
      "y": 1.0,
      "z": 1.0
     },
     "rotZ": 0.0
    }
   },
   "Effects": {
    "transform": {
     "pos": {
      "x": 0.0,
      "y": 0.0,
      "z": 0.0
     },
     "scale": {
      "x": 1.0,
      "y": 1.0,
      "z": 1.0
     },
     "rotZ": 0.0
    }
   },
   "Effects/Overheat": {
    "transform": {
     "pos": {
      "x": 0.0,
      "y": -0.513,
      "z": 0.0
     },
     "scale": {
      "x": 0.975,
      "y": 1.0,
      "z": 1.45
     },
     "rotZ": -0.0
    }
   },
   "Effects/BurningMan": {
    "transform": {
     "pos": {
      "x": -0.04,
      "y": 0.02,
      "z": 0.0
     },
     "scale": {
      "x": 0.975,
      "y": 1.0,
      "z": 1.45
     },
     "rotZ": -0.0
    }
   },
   "Effects/GodOfThunderEyes": {
    "transform": {
     "pos": {
      "x": 0.0,
      "y": 0.0,
      "z": 0.0
     },
     "scale": {
      "x": 1.0,
      "y": 1.0,
      "z": 1.0
     },
     "rotZ": -0.0
    }
   },
   "Effects/GodOfThunderEyes/Eyes": {
    "transform": {
     "pos": {
      "x": -0.083,
      "y": 0.358,
      "z": 0.0
     },
     "scale": {
      "x": 1.0,
      "y": 1.0,
      "z": 1.0
     },
     "rotZ": 0.0
    }
   },
   "Effects/GodOfThunderEyes/Eyes (1)": {
    "transform": {
     "pos": {
      "x": 0.087,
      "y": 0.358,
      "z": 0.0
     },
     "scale": {
      "x": 1.0,
      "y": 1.0,
      "z": 1.0
     },
     "rotZ": 0.0
    }
   },
   "Effects/VampireCloak": {
    "transform": {
     "pos": {
      "x": 0.0,
      "y": 0.21,
      "z": 0.0
     },
     "scale": {
      "x": 3.3,
      "y": 3.3,
      "z": 1.0
     },
     "rotZ": -0.0
    }
   },
   "Effects/BloodyMage": {
    "transform": {
     "pos": {
      "x": 0.0,
      "y": 0.34,
      "z": 0.0
     },
     "scale": {
      "x": 1.0,
      "y": 1.0,
      "z": 1.0
     },
     "rotZ": -360.0
    }
   },
   "GroundDust": {
    "transform": {
     "pos": {
      "x": 0.0,
      "y": -0.467,
      "z": -0.0
     },
     "scale": {
      "x": 1.0,
      "y": 1.0,
      "z": 1.0
     },
     "rotZ": 0.0
    }
   }
  }
 },
 "prefabs": {
  "EncCard": {
   "transform": {
    "pos": {
     "x": 0.0,
     "y": 0.0,
     "z": 0.0
    },
    "scale": {
     "x": 1.0,
     "y": 1.0,
     "z": 1.0
    },
    "rotZ": -0.0
   },
   "layer": 5,
   "scripts": {
    "EncCard": {
     "_itemName": {
      "prefab": "EncCard"
     },
     "_itemDescription": {
      "prefab": "EncCard"
     },
     "_itemIcon": {
      "prefab": "EncCard"
     },
     "_mainOutline": {
      "prefab": "EncCard"
     },
     "_iconOutline": {
      "prefab": "EncCard"
     }
    },
    "UnityEngine.UI.Image": {
     "m_Color": {
      "r": 0.0,
      "g": 0.0,
      "b": 0.0,
      "a": 1.0
     },
     "m_RaycastTarget": false,
     "m_RaycastPadding": {
      "x": 0.0,
      "y": 0.0,
      "z": 0.0,
      "w": 0.0
     },
     "m_Maskable": true,
     "m_Type": 1,
     "m_PreserveAspect": false,
     "m_FillCenter": true,
     "m_FillMethod": 4,
     "m_FillAmount": 1.0,
     "m_FillClockwise": true,
     "m_FillOrigin": 0,
     "m_UseSpriteMesh": false,
     "m_PixelsPerUnitMultiplier": 1.0
    },
    "UnityEngine.UI.Outline": {
     "m_EffectColor": {
      "r": 1.0,
      "g": 1.0,
      "b": 1.0,
      "a": 1.0
     },
     "m_EffectDistance": {
      "x": 3.0,
      "y": 3.0
     },
     "m_UseGraphicAlpha": true
    }
   },
   "children": {
    "IconBG": {
     "transform": {
      "pos": {
       "x": 0.0,
       "y": 0.0,
       "z": 0.0
      },
      "scale": {
       "x": 1.05875,
       "y": 1.08625,
       "z": 1.1
      },
      "rotZ": -0.0
     },
     "scripts": {
      "UnityEngine.UI.Image": {
       "m_Color": {
        "r": 1.0,
        "g": 1.0,
        "b": 1.0,
        "a": 1.0
       },
       "m_RaycastTarget": false,
       "m_RaycastPadding": {
        "x": 0.0,
        "y": 0.0,
        "z": 0.0,
        "w": 0.0
       },
       "m_Maskable": true,
       "m_Type": 1,
       "m_PreserveAspect": true,
       "m_FillCenter": true,
       "m_FillMethod": 4,
       "m_FillAmount": 1.0,
       "m_FillClockwise": true,
       "m_FillOrigin": 0,
       "m_UseSpriteMesh": false,
       "m_PixelsPerUnitMultiplier": 1.0
      }
     }
    },
    "Name": {
     "transform": {
      "pos": {
       "x": 0.0,
       "y": 0.0,
       "z": 0.0
      },
      "scale": {
       "x": 1.0,
       "y": 1.0,
       "z": 1.0
      },
      "rotZ": -0.0
     },
     "scripts": {
      "UnityEngine.UI.Text": {
       "m_Color": {
        "r": 1.0,
        "g": 1.0,
        "b": 1.0,
        "a": 1.0
       },
       "m_RaycastTarget": true,
       "m_RaycastPadding": {
        "x": 0.0,
        "y": 0.0,
        "z": 0.0,
        "w": 0.0
       },
       "m_Maskable": true
      }
     }
    },
    "Description": {
     "transform": {
      "pos": {
       "x": 0.0,
       "y": 0.0,
       "z": 0.0
      },
      "scale": {
       "x": 1.0,
       "y": 1.0,
       "z": 1.0
      },
      "rotZ": -0.0
     },
     "scripts": {
      "UnityEngine.UI.Text": {
       "m_Color": {
        "r": 1.0,
        "g": 1.0,
        "b": 1.0,
        "a": 1.0
       },
       "m_RaycastTarget": true,
       "m_RaycastPadding": {
        "x": 0.0,
        "y": 0.0,
        "z": 0.0,
        "w": 0.0
       },
       "m_Maskable": true
      }
     }
    }
   }
  },
  "TitlePrefab": {
   "transform": {
    "pos": {
     "x": 0.0,
     "y": 0.0,
     "z": 0.0
    },
    "scale": {
     "x": 1.0,
     "y": 1.0,
     "z": 1.0
    },
    "rotZ": -0.0
   },
   "layer": 5,
   "scripts": {
    "UnityEngine.UI.Text": {
     "m_Color": {
      "r": 1.0,
      "g": 1.0,
      "b": 1.0,
      "a": 1.0
     },
     "m_RaycastTarget": true,
     "m_RaycastPadding": {
      "x": 0.0,
      "y": 0.0,
      "z": 0.0,
      "w": 0.0
     },
     "m_Maskable": true
    }
   }
  },
  "LvlMark": {
   "transform": {
    "pos": {
     "x": 0.0,
     "y": 0.0,
     "z": 0.0
    },
    "scale": {
     "x": 1.0,
     "y": 1.0,
     "z": 1.0
    },
    "rotZ": -0.0
   },
   "layer": 5,
   "scripts": {
    "UnityEngine.UI.Image": {
     "m_Color": {
      "r": 1.0,
      "g": 1.0,
      "b": 1.0,
      "a": 1.0
     },
     "m_RaycastTarget": true,
     "m_RaycastPadding": {
      "x": 0.0,
      "y": 0.0,
      "z": 0.0,
      "w": 0.0
     },
     "m_Maskable": true,
     "m_Type": 0,
     "m_PreserveAspect": false,
     "m_FillCenter": true,
     "m_FillMethod": 4,
     "m_FillAmount": 1.0,
     "m_FillClockwise": true,
     "m_FillOrigin": 0,
     "m_UseSpriteMesh": false,
     "m_PixelsPerUnitMultiplier": 1.0
    }
   }
  },
  "Card": {
   "transform": {
    "pos": {
     "x": 0.0,
     "y": 0.0,
     "z": 0.0
    },
    "scale": {
     "x": 1.0,
     "y": 1.0,
     "z": 1.0
    },
    "rotZ": -0.0
   },
   "layer": 5,
   "scripts": {
    "UnityEngine.UI.Image": {
     "m_Color": {
      "r": 0.122642,
      "g": 0.122642,
      "b": 0.122642,
      "a": 1.0
     },
     "m_RaycastTarget": true,
     "m_RaycastPadding": {
      "x": 0.0,
      "y": 0.0,
      "z": 0.0,
      "w": 0.0
     },
     "m_Maskable": true,
     "m_Type": 0,
     "m_PreserveAspect": false,
     "m_FillCenter": true,
     "m_FillMethod": 4,
     "m_FillAmount": 1.0,
     "m_FillClockwise": true,
     "m_FillOrigin": 0,
     "m_UseSpriteMesh": false,
     "m_PixelsPerUnitMultiplier": 1.0
    },
    "Card": {
     "icon": {
      "prefab": "Card"
     },
     "quantity": {
      "prefab": "Card"
     }
    }
   },
   "children": {
    "Icon": {
     "transform": {
      "pos": {
       "x": 0.0,
       "y": 0.0,
       "z": 0.0
      },
      "scale": {
       "x": 1.0,
       "y": 1.0,
       "z": 1.0
      },
      "rotZ": 0.0
     },
     "scripts": {
      "UnityEngine.UI.Image": {
       "m_Color": {
        "r": 1.0,
        "g": 1.0,
        "b": 1.0,
        "a": 1.0
       },
       "m_RaycastTarget": true,
       "m_RaycastPadding": {
        "x": 0.0,
        "y": 0.0,
        "z": 0.0,
        "w": 0.0
       },
       "m_Maskable": true,
       "m_Type": 0,
       "m_PreserveAspect": false,
       "m_FillCenter": true,
       "m_FillMethod": 4,
       "m_FillAmount": 1.0,
       "m_FillClockwise": true,
       "m_FillOrigin": 0,
       "m_UseSpriteMesh": false,
       "m_PixelsPerUnitMultiplier": 1.0
      }
     }
    },
    "Quantity": {
     "transform": {
      "pos": {
       "x": 0.0,
       "y": 0.0,
       "z": 0.0
      },
      "scale": {
       "x": 1.0,
       "y": 1.0,
       "z": 1.0
      },
      "rotZ": -0.0
     },
     "scripts": {
      "UnityEngine.UI.Text": {
       "m_Color": {
        "r": 1.0,
        "g": 1.0,
        "b": 1.0,
        "a": 1.0
       },
       "m_RaycastTarget": true,
       "m_RaycastPadding": {
        "x": 0.0,
        "y": 0.0,
        "z": 0.0,
        "w": 0.0
       },
       "m_Maskable": true
      },
      "UnityEngine.UI.Outline": {
       "m_EffectColor": {
        "r": 0.0,
        "g": 0.0,
        "b": 0.0,
        "a": 1.0
       },
       "m_EffectDistance": {
        "x": 2.0,
        "y": 2.0
       },
       "m_UseGraphicAlpha": true
      }
     }
    }
   }
  },
  "WIllowisp": {
   "transform": {
    "pos": {
     "x": 0.636,
     "y": -3.265,
     "z": 0.0
    },
    "scale": {
     "x": 1.0,
     "y": 1.0,
     "z": 1.0
    },
    "rotZ": 0.0
   },
   "layer": 0,
   "scripts": {
    "WilloWsip": {
     "willo_number": 1
    }
   },
   "children": {
    "Graphics": {
     "transform": {
      "pos": {
       "x": 0.0,
       "y": 0.0,
       "z": 0.0
      },
      "scale": {
       "x": 1.0,
       "y": 1.0,
       "z": 1.0
      },
      "rotZ": -0.0
     },
     "scripts": {}
    }
   }
  },
  "Projectile": {
   "transform": {
    "pos": {
     "x": 0.0,
     "y": 0.0,
     "z": 0.0
    },
    "scale": {
     "x": 0.13,
     "y": 0.13,
     "z": 0.13
    },
    "rotZ": 0.0
   },
   "layer": 0,
   "scripts": {
    "Projectile": {
     "projectile_explode": {
      "prefab": "ProjectileExplode"
     },
     "explosive_explode": {
      "prefab": "ExplosiveProjectileExplode"
     },
     "black_hole": {
      "prefab": "BlackHole"
     },
     "hit_count": 1,
     "can_cancel": true,
     "can_lifesteal": true,
     "atk_multiplier": 1.0,
     "is_homing": false,
     "is_explosive": false,
     "is_friction": false,
     "can_pull": true,
     "is_piercing": false,
     "projectile_generation": 0,
     "explosion_range": 1.2
    }
   },
   "colliders": [
    {
     "kind": "circle",
     "trigger": true,
     "enabled": true,
     "offset": {
      "x": 0.0,
      "y": 0.0
     },
     "radius": 0.5
    }
   ],
   "body": {
    "type": "kinematic",
    "mass": 1.0,
    "gravityScale": 1.0,
    "drag": 0.0,
    "constraints": 0,
    "material": null
   },
   "children": {
    "Trail": {
     "transform": {
      "pos": {
       "x": 0.0,
       "y": 0.0,
       "z": 0.0
      },
      "scale": {
       "x": 1.0,
       "y": 1.0,
       "z": 1.0
      },
      "rotZ": 0.0
     },
     "scripts": {
      "ParticleActivator": {}
     }
    }
   }
  },
  "Projectile_Homing": {
   "transform": {
    "pos": {
     "x": 0.0,
     "y": 0.0,
     "z": 0.0
    },
    "scale": {
     "x": 0.09,
     "y": 0.09,
     "z": 0.09
    },
    "rotZ": 0.0
   },
   "layer": 0,
   "scripts": {
    "Projectile": {
     "projectile_explode": {
      "prefab": "ProjectileExplode"
     },
     "explosive_explode": {
      "prefab": "ExplosiveProjectileExplode"
     },
     "black_hole": {
      "prefab": "BlackHole"
     },
     "hit_count": 1,
     "can_cancel": true,
     "can_lifesteal": true,
     "atk_multiplier": 0.5,
     "is_homing": true,
     "is_explosive": false,
     "is_friction": false,
     "can_pull": true,
     "is_piercing": false,
     "projectile_generation": 0,
     "explosion_range": 1.2
    }
   },
   "colliders": [
    {
     "kind": "circle",
     "trigger": true,
     "enabled": true,
     "offset": {
      "x": 0.0,
      "y": 0.0
     },
     "radius": 0.5
    }
   ],
   "body": {
    "type": "kinematic",
    "mass": 1.0,
    "gravityScale": 1.0,
    "drag": 0.0,
    "constraints": 0,
    "material": null
   },
   "children": {
    "Trail": {
     "transform": {
      "pos": {
       "x": 0.0,
       "y": 0.0,
       "z": 0.0
      },
      "scale": {
       "x": 1.0,
       "y": 1.0,
       "z": 1.0
      },
      "rotZ": 0.0
     },
     "scripts": {
      "ParticleActivator": {}
     }
    }
   }
  },
  "Projectile_Triple": {
   "transform": {
    "pos": {
     "x": 0.0,
     "y": 0.0,
     "z": 0.0
    },
    "scale": {
     "x": 0.09,
     "y": 0.12,
     "z": 0.13
    },
    "rotZ": 0.0
   },
   "layer": 0,
   "scripts": {
    "Projectile": {
     "projectile_explode": {
      "prefab": "ProjectileExplode"
     },
     "explosive_explode": {
      "prefab": "ExplosiveProjectileExplode"
     },
     "black_hole": {
      "prefab": "BlackHole"
     },
     "hit_count": 1,
     "can_cancel": true,
     "can_lifesteal": true,
     "atk_multiplier": 0.5,
     "is_homing": false,
     "is_explosive": false,
     "is_friction": false,
     "can_pull": true,
     "is_piercing": false,
     "projectile_generation": 0,
     "explosion_range": 1.2
    }
   },
   "colliders": [
    {
     "kind": "circle",
     "trigger": true,
     "enabled": true,
     "offset": {
      "x": 0.0,
      "y": 0.0
     },
     "radius": 0.5
    }
   ],
   "body": {
    "type": "kinematic",
    "mass": 1.0,
    "gravityScale": 1.0,
    "drag": 0.0,
    "constraints": 0,
    "material": null
   },
   "children": {
    "Trail": {
     "transform": {
      "pos": {
       "x": 0.0,
       "y": 0.0,
       "z": 0.0
      },
      "scale": {
       "x": 1.0,
       "y": 1.0,
       "z": 1.0
      },
      "rotZ": 0.0
     },
     "scripts": {
      "ParticleActivator": {}
     }
    }
   }
  },
  "ExplosiveProjectile": {
   "transform": {
    "pos": {
     "x": 0.0,
     "y": 0.0,
     "z": 0.0
    },
    "scale": {
     "x": 0.15,
     "y": 0.15,
     "z": 0.15
    },
    "rotZ": 0.0
   },
   "layer": 0,
   "scripts": {
    "Projectile": {
     "projectile_explode": {
      "prefab": "ProjectileExplode"
     },
     "explosive_explode": {
      "prefab": "ExplosiveProjectileExplode"
     },
     "black_hole": {
      "prefab": "BlackHole"
     },
     "hit_count": 1,
     "can_cancel": true,
     "can_lifesteal": true,
     "atk_multiplier": 0.42,
     "is_homing": false,
     "is_explosive": true,
     "is_friction": false,
     "can_pull": false,
     "is_piercing": false,
     "projectile_generation": 0,
     "explosion_range": 1.2
    }
   },
   "colliders": [
    {
     "kind": "circle",
     "trigger": true,
     "enabled": true,
     "offset": {
      "x": 0.0,
      "y": 0.0
     },
     "radius": 0.5
    }
   ],
   "body": {
    "type": "kinematic",
    "mass": 1.0,
    "gravityScale": 1.0,
    "drag": 0.0,
    "constraints": 0,
    "material": null
   },
   "children": {
    "Trail": {
     "transform": {
      "pos": {
       "x": 0.0,
       "y": 0.0,
       "z": 0.0
      },
      "scale": {
       "x": 1.0,
       "y": 1.0,
       "z": 1.0
      },
      "rotZ": 0.0
     },
     "scripts": {
      "ParticleActivator": {}
     }
    }
   }
  },
  "Projectile_Piercing": {
   "transform": {
    "pos": {
     "x": 0.0,
     "y": 0.0,
     "z": 0.0
    },
    "scale": {
     "x": 0.337547,
     "y": 0.018843,
     "z": 0.13
    },
    "rotZ": 0.0
   },
   "layer": 0,
   "scripts": {
    "Projectile": {
     "projectile_explode": {
      "prefab": "ProjectileExplode"
     },
     "explosive_explode": {
      "prefab": "ExplosiveProjectileExplode"
     },
     "black_hole": {
      "prefab": "BlackHole"
     },
     "hit_count": 1,
     "can_cancel": true,
     "can_lifesteal": true,
     "atk_multiplier": 0.25,
     "is_homing": false,
     "is_explosive": false,
     "is_friction": false,
     "can_pull": true,
     "is_piercing": true,
     "projectile_generation": 0,
     "explosion_range": 1.2
    }
   },
   "colliders": [
    {
     "kind": "circle",
     "trigger": true,
     "enabled": true,
     "offset": {
      "x": 0.0,
      "y": 0.0
     },
     "radius": 0.5
    }
   ],
   "body": {
    "type": "kinematic",
    "mass": 1.0,
    "gravityScale": 1.0,
    "drag": 0.0,
    "constraints": 0,
    "material": null
   },
   "children": {
    "Trail": {
     "transform": {
      "pos": {
       "x": 0.0,
       "y": 0.0,
       "z": 0.0
      },
      "scale": {
       "x": 1.0,
       "y": 1.0,
       "z": 1.0
      },
      "rotZ": 0.0
     },
     "scripts": {
      "ParticleActivator": {}
     }
    }
   }
  },
  "Projectile_Fragment": {
   "transform": {
    "pos": {
     "x": 0.0,
     "y": 0.0,
     "z": 0.0
    },
    "scale": {
     "x": 0.09,
     "y": 0.09,
     "z": 0.09
    },
    "rotZ": 0.0
   },
   "layer": 0,
   "scripts": {
    "Projectile": {
     "projectile_explode": {
      "prefab": "ProjectileExplode"
     },
     "explosive_explode": {
      "prefab": "ExplosiveProjectileExplode"
     },
     "black_hole": {
      "prefab": "BlackHole"
     },
     "hit_count": 1,
     "can_cancel": false,
     "can_lifesteal": true,
     "atk_multiplier": 0.4,
     "is_homing": false,
     "is_explosive": false,
     "is_friction": false,
     "can_pull": true,
     "is_piercing": false,
     "projectile_generation": 1,
     "explosion_range": 1.2
    }
   },
   "colliders": [
    {
     "kind": "circle",
     "trigger": true,
     "enabled": true,
     "offset": {
      "x": 0.0,
      "y": 0.0
     },
     "radius": 0.5
    }
   ],
   "children": {
    "Trail": {
     "transform": {
      "pos": {
       "x": 0.0,
       "y": 0.0,
       "z": 0.0
      },
      "scale": {
       "x": 1.0,
       "y": 1.0,
       "z": 1.0
      },
      "rotZ": 0.0
     },
     "scripts": {
      "ParticleActivator": {}
     }
    }
   }
  },
  "Thunderbolt": {
   "transform": {
    "pos": {
     "x": 0.06,
     "y": 0.07,
     "z": 0.0
    },
    "scale": {
     "x": 2.266453,
     "y": 1.6982,
     "z": 1.0
    },
    "rotZ": 0.0
   },
   "layer": 0,
   "scripts": {
    "ThunderBolt": {
     "can_pull": false,
     "black_hole": {
      "prefab": "BlackHole"
     },
     "thunder_damage": 10.0
    }
   },
   "colliders": [
    {
     "kind": "box",
     "trigger": true,
     "enabled": true,
     "offset": {
      "x": 0.003238,
      "y": 0.159917
     },
     "size": {
      "x": 0.242205,
      "y": 4.172416
     }
    }
   ],
   "body": {
    "type": "dynamic",
    "mass": 0.2,
    "gravityScale": 0.0,
    "drag": 0.0,
    "constraints": 0,
    "material": null
   },
   "children": {
    "Particle System": {
     "transform": {
      "pos": {
       "x": 0.0,
       "y": 0.0,
       "z": 0.0
      },
      "scale": {
       "x": 1.0,
       "y": 1.0,
       "z": 1.0
      },
      "rotZ": 0.0
     },
     "scripts": {
      "ParticleActivator": {}
     }
    }
   }
  },
  "FrictionProjectile": {
   "transform": {
    "pos": {
     "x": 0.0,
     "y": 0.0,
     "z": 0.0
    },
    "scale": {
     "x": 0.27675,
     "y": 0.13065,
     "z": 0.18
    },
    "rotZ": 0.0
   },
   "layer": 0,
   "scripts": {
    "Projectile": {
     "projectile_explode": {
      "prefab": "ProjectileExplode"
     },
     "explosive_explode": {
      "prefab": "ExplosiveProjectileExplode"
     },
     "hit_count": 1,
     "can_cancel": true,
     "can_lifesteal": true,
     "atk_multiplier": 0.5,
     "is_homing": false,
     "is_explosive": true,
     "is_friction": true,
     "can_pull": false,
     "is_piercing": false,
     "projectile_generation": 0,
     "explosion_range": 1.0
    }
   },
   "colliders": [
    {
     "kind": "circle",
     "trigger": true,
     "enabled": true,
     "offset": {
      "x": 0.01,
      "y": 0.0
     },
     "radius": 0.204642
    }
   ],
   "body": {
    "type": "kinematic",
    "mass": 1.0,
    "gravityScale": 1.0,
    "drag": 0.0,
    "constraints": 0,
    "material": null
   },
   "children": {
    "Trail": {
     "transform": {
      "pos": {
       "x": 0.0,
       "y": 0.0,
       "z": 0.0
      },
      "scale": {
       "x": 1.0,
       "y": 1.0,
       "z": 1.0
      },
      "rotZ": 0.0
     },
     "scripts": {
      "ParticleActivator": {}
     }
    }
   }
  },
  "CometExplosion": {
   "transform": {
    "pos": {
     "x": 0.0,
     "y": 0.0,
     "z": 0.0
    },
    "scale": {
     "x": 50.0,
     "y": 50.0,
     "z": 30.0
    },
    "rotZ": 0.0
   },
   "layer": 0,
   "scripts": {
    "CometExplosion": {
     "explosion_damage": 0.0,
     "explosion_size": 0.0
    }
   },
   "body": {
    "type": "dynamic",
    "mass": 0.2,
    "gravityScale": 0.0,
    "drag": 0.0,
    "constraints": 0,
    "material": null
   },
   "colliders": [
    {
     "kind": "circle",
     "trigger": true,
     "enabled": true,
     "offset": {
      "x": 0.0,
      "y": 0.0
     },
     "radius": 0.1
    }
   ],
   "children": {
    "Particle System": {
     "transform": {
      "pos": {
       "x": 0.0,
       "y": 0.0,
       "z": 0.0
      },
      "scale": {
       "x": 4.0,
       "y": 4.0,
       "z": 2.0
      },
      "rotZ": 0.0
     },
     "scripts": {
      "ParticleActivator": {}
     }
    }
   }
  },
  "ShopCard": {
   "transform": {
    "pos": {
     "x": 0.0,
     "y": 0.0,
     "z": 0.0
    },
    "scale": {
     "x": 0.85,
     "y": 0.85,
     "z": 0.85
    },
    "rotZ": -0.0
   },
   "layer": 5,
   "scripts": {
    "UnityEngine.UI.Image": {
     "m_Color": {
      "r": 0.0,
      "g": 0.0,
      "b": 0.0,
      "a": 1.0
     },
     "m_RaycastTarget": true,
     "m_RaycastPadding": {
      "x": 0.0,
      "y": 0.0,
      "z": 0.0,
      "w": 0.0
     },
     "m_Maskable": true,
     "m_Type": 0,
     "m_PreserveAspect": false,
     "m_FillCenter": true,
     "m_FillMethod": 4,
     "m_FillAmount": 1.0,
     "m_FillClockwise": true,
     "m_FillOrigin": 0,
     "m_UseSpriteMesh": false,
     "m_PixelsPerUnitMultiplier": 1.0
    },
    "UnityEngine.UI.Outline": {
     "m_EffectColor": {
      "r": 1.0,
      "g": 1.0,
      "b": 1.0,
      "a": 1.0
     },
     "m_EffectDistance": {
      "x": 5.0,
      "y": 5.0
     },
     "m_UseGraphicAlpha": true
    },
    "ItemScript": {
     "item_name_ui": {
      "prefab": "ShopCard"
     },
     "item_desc_ui": {
      "prefab": "ShopCard"
     },
     "item_icon_ui": {
      "prefab": "ShopCard"
     },
     "item_rarity_ui": {
      "prefab": "ShopCard"
     },
     "transcendence_panel": {
      "prefab": "Transcendence"
     }
    },
    "Core.BetterButton": {
     "m_Transition": 3,
     "m_Interactable": true,
     "m_TargetGraphic": {
      "prefab": "ShopCard"
     }
    }
   },
   "children": {
    "Image": {
     "transform": {
      "pos": {
       "x": 0.0,
       "y": 0.0,
       "z": 0.0
      },
      "scale": {
       "x": 1.0,
       "y": 1.0,
       "z": 1.0
      },
      "rotZ": 0.0
     },
     "scripts": {
      "UnityEngine.UI.Image": {
       "m_Color": {
        "r": 0.743859,
        "g": 0.765774,
        "b": 0.792453,
        "a": 1.0
       },
       "m_RaycastTarget": true,
       "m_RaycastPadding": {
        "x": 0.0,
        "y": 0.0,
        "z": 0.0,
        "w": 0.0
       },
       "m_Maskable": true,
       "m_Type": 0,
       "m_PreserveAspect": false,
       "m_FillCenter": true,
       "m_FillMethod": 4,
       "m_FillAmount": 1.0,
       "m_FillClockwise": true,
       "m_FillOrigin": 0,
       "m_UseSpriteMesh": false,
       "m_PixelsPerUnitMultiplier": 1.0
      }
     }
    },
    "Title": {
     "transform": {
      "pos": {
       "x": 0.0,
       "y": 0.0,
       "z": 0.0
      },
      "scale": {
       "x": 1.0,
       "y": 1.0,
       "z": 1.0
      },
      "rotZ": 0.0
     },
     "scripts": {
      "UnityEngine.UI.Text": {
       "m_Color": {
        "r": 1.0,
        "g": 1.0,
        "b": 1.0,
        "a": 1.0
       },
       "m_RaycastTarget": true,
       "m_RaycastPadding": {
        "x": 0.0,
        "y": 0.0,
        "z": 0.0,
        "w": 0.0
       },
       "m_Maskable": true
      }
     }
    },
    "RarityOutline": {
     "transform": {
      "pos": {
       "x": 0.0,
       "y": 0.0,
       "z": 0.0
      },
      "scale": {
       "x": 1.0,
       "y": 1.0,
       "z": 1.0
      },
      "rotZ": -0.0
     },
     "scripts": {
      "UnityEngine.UI.Image": {
       "m_Color": {
        "r": 1.0,
        "g": 1.0,
        "b": 1.0,
        "a": 1.0
       },
       "m_RaycastTarget": true,
       "m_RaycastPadding": {
        "x": 0.0,
        "y": 0.0,
        "z": 0.0,
        "w": 0.0
       },
       "m_Maskable": true,
       "m_Type": 1,
       "m_PreserveAspect": false,
       "m_FillCenter": true,
       "m_FillMethod": 4,
       "m_FillAmount": 1.0,
       "m_FillClockwise": true,
       "m_FillOrigin": 0,
       "m_UseSpriteMesh": false,
       "m_PixelsPerUnitMultiplier": 1.0
      }
     }
    },
    "Icon": {
     "transform": {
      "pos": {
       "x": 0.0,
       "y": 0.0,
       "z": 0.0
      },
      "scale": {
       "x": 1.0,
       "y": 1.0,
       "z": 1.0
      },
      "rotZ": 0.0
     },
     "scripts": {
      "UnityEngine.UI.Image": {
       "m_Color": {
        "r": 1.0,
        "g": 1.0,
        "b": 1.0,
        "a": 1.0
       },
       "m_RaycastTarget": true,
       "m_RaycastPadding": {
        "x": 0.0,
        "y": 0.0,
        "z": 0.0,
        "w": 0.0
       },
       "m_Maskable": true,
       "m_Type": 0,
       "m_PreserveAspect": false,
       "m_FillCenter": true,
       "m_FillMethod": 4,
       "m_FillAmount": 1.0,
       "m_FillClockwise": true,
       "m_FillOrigin": 0,
       "m_UseSpriteMesh": false,
       "m_PixelsPerUnitMultiplier": 1.0
      }
     }
    },
    "Description": {
     "transform": {
      "pos": {
       "x": 0.0,
       "y": 0.0,
       "z": 0.0
      },
      "scale": {
       "x": 1.0,
       "y": 1.0,
       "z": 1.0
      },
      "rotZ": 0.0
     },
     "scripts": {
      "UnityEngine.UI.Text": {
       "m_Color": {
        "r": 1.0,
        "g": 1.0,
        "b": 1.0,
        "a": 1.0
       },
       "m_RaycastTarget": true,
       "m_RaycastPadding": {
        "x": 0.0,
        "y": 0.0,
        "z": 0.0,
        "w": 0.0
       },
       "m_Maskable": true
      }
     }
    }
   }
  },
  "RefreshCards": {
   "transform": {
    "pos": {
     "x": 0.0,
     "y": 0.0,
     "z": 0.0
    },
    "scale": {
     "x": 0.85,
     "y": 0.85,
     "z": 0.85
    },
    "rotZ": -0.0
   },
   "layer": 5,
   "scripts": {
    "UnityEngine.UI.Image": {
     "m_Color": {
      "r": 0.0,
      "g": 0.0,
      "b": 0.0,
      "a": 1.0
     },
     "m_RaycastTarget": true,
     "m_RaycastPadding": {
      "x": 0.0,
      "y": 0.0,
      "z": 0.0,
      "w": 0.0
     },
     "m_Maskable": true,
     "m_Type": 0,
     "m_PreserveAspect": false,
     "m_FillCenter": true,
     "m_FillMethod": 4,
     "m_FillAmount": 1.0,
     "m_FillClockwise": true,
     "m_FillOrigin": 0,
     "m_UseSpriteMesh": false,
     "m_PixelsPerUnitMultiplier": 1.0
    },
    "UnityEngine.UI.Outline": {
     "m_EffectColor": {
      "r": 1.0,
      "g": 1.0,
      "b": 1.0,
      "a": 1.0
     },
     "m_EffectDistance": {
      "x": 5.0,
      "y": 5.0
     },
     "m_UseGraphicAlpha": true
    },
    "RerollCard": {
     "card_desc": {
      "prefab": "RefreshCards"
     },
     "soul_img": {
      "prefab": "RefreshCards"
     }
    },
    "Core.BetterButton": {
     "m_Transition": 3,
     "m_Interactable": true,
     "m_TargetGraphic": {
      "prefab": "RefreshCards"
     }
    }
   },
   "children": {
    "Image": {
     "transform": {
      "pos": {
       "x": 0.0,
       "y": 0.0,
       "z": 0.0
      },
      "scale": {
       "x": 1.0,
       "y": 1.0,
       "z": 1.0
      },
      "rotZ": 0.0
     },
     "scripts": {
      "UnityEngine.UI.Image": {
       "m_Color": {
        "r": 0.743859,
        "g": 0.765774,
        "b": 0.792453,
        "a": 1.0
       },
       "m_RaycastTarget": true,
       "m_RaycastPadding": {
        "x": 0.0,
        "y": 0.0,
        "z": 0.0,
        "w": 0.0
       },
       "m_Maskable": true,
       "m_Type": 0,
       "m_PreserveAspect": false,
       "m_FillCenter": true,
       "m_FillMethod": 4,
       "m_FillAmount": 1.0,
       "m_FillClockwise": true,
       "m_FillOrigin": 0,
       "m_UseSpriteMesh": false,
       "m_PixelsPerUnitMultiplier": 1.0
      }
     }
    },
    "Title": {
     "transform": {
      "pos": {
       "x": 0.0,
       "y": 0.0,
       "z": 0.0
      },
      "scale": {
       "x": 1.0,
       "y": 1.0,
       "z": 1.0
      },
      "rotZ": 0.0
     },
     "scripts": {
      "UnityEngine.UI.Text": {
       "m_Color": {
        "r": 1.0,
        "g": 1.0,
        "b": 1.0,
        "a": 1.0
       },
       "m_RaycastTarget": true,
       "m_RaycastPadding": {
        "x": 0.0,
        "y": 0.0,
        "z": 0.0,
        "w": 0.0
       },
       "m_Maskable": true
      }
     }
    },
    "RarityOutline": {
     "transform": {
      "pos": {
       "x": 0.0,
       "y": 0.0,
       "z": 0.0
      },
      "scale": {
       "x": 1.0,
       "y": 1.0,
       "z": 1.0
      },
      "rotZ": -0.0
     },
     "scripts": {
      "UnityEngine.UI.Image": {
       "m_Color": {
        "r": 1.0,
        "g": 1.0,
        "b": 1.0,
        "a": 1.0
       },
       "m_RaycastTarget": true,
       "m_RaycastPadding": {
        "x": 0.0,
        "y": 0.0,
        "z": 0.0,
        "w": 0.0
       },
       "m_Maskable": true,
       "m_Type": 1,
       "m_PreserveAspect": false,
       "m_FillCenter": true,
       "m_FillMethod": 4,
       "m_FillAmount": 1.0,
       "m_FillClockwise": true,
       "m_FillOrigin": 0,
       "m_UseSpriteMesh": false,
       "m_PixelsPerUnitMultiplier": 1.0
      }
     }
    },
    "Icon": {
     "transform": {
      "pos": {
       "x": 0.0,
       "y": 0.0,
       "z": 0.0
      },
      "scale": {
       "x": 1.0,
       "y": 1.0,
       "z": 1.0
      },
      "rotZ": 0.0
     },
     "scripts": {
      "UnityEngine.UI.Image": {
       "m_Color": {
        "r": 1.0,
        "g": 1.0,
        "b": 1.0,
        "a": 1.0
       },
       "m_RaycastTarget": true,
       "m_RaycastPadding": {
        "x": 0.0,
        "y": 0.0,
        "z": 0.0,
        "w": 0.0
       },
       "m_Maskable": true,
       "m_Type": 0,
       "m_PreserveAspect": false,
       "m_FillCenter": true,
       "m_FillMethod": 4,
       "m_FillAmount": 1.0,
       "m_FillClockwise": true,
       "m_FillOrigin": 0,
       "m_UseSpriteMesh": false,
       "m_PixelsPerUnitMultiplier": 1.0
      }
     }
    },
    "Description": {
     "transform": {
      "pos": {
       "x": 0.0,
       "y": 0.0,
       "z": 0.0
      },
      "scale": {
       "x": 1.0,
       "y": 1.0,
       "z": 1.0
      },
      "rotZ": 0.0
     },
     "scripts": {
      "UnityEngine.UI.Text": {
       "m_Color": {
        "r": 1.0,
        "g": 1.0,
        "b": 1.0,
        "a": 1.0
       },
       "m_RaycastTarget": true,
       "m_RaycastPadding": {
        "x": 0.0,
        "y": 0.0,
        "z": 0.0,
        "w": 0.0
       },
       "m_Maskable": true
      }
     }
    }
   }
  },
  "Weak_Ranged": {
   "transform": {
    "pos": {
     "x": 0.0,
     "y": 0.0,
     "z": 0.0
    },
    "scale": {
     "x": 0.5,
     "y": 0.5,
     "z": 0.5
    },
    "rotZ": 0.0
   },
   "layer": 6,
   "scripts": {
    "EnemyStats": {
     "_initialSize": {
      "x": 0.0,
      "y": 0.0,
      "z": 0.0
     },
     "max_hp": 6.0,
     "hp": 0.0,
     "atk_speed": 1.75,
     "atk_damage": 2.0,
     "melee_atk_damage": 1.0,
     "projectile_speed": 0.45,
     "projectile_resistance": 1,
     "fragmenter": {
      "prefab": "Fragmenter"
     },
     "healing_orb": {
      "prefab": "HealingOrb"
     },
     "now_color": {
      "r": 0.0,
      "g": 0.0,
      "b": 0.0,
      "a": 0.0
     },
     "damage_text": {
      "prefab": "DamageText"
     },
     "blood_particles": {
      "prefab": "Blood"
     },
     "projectile_generation": 0,
     "bleed_cooldown": 1.0,
     "bleed_amount": 0.0,
     "souls_orb": {
      "prefab": "SoulOrb"
     },
     "beam_cd": 0.0
    },
    "RangedBehavior": {
     "move_speed": 0.25,
     "initial_move_speed": 0.0,
     "vertical_move_speed": 1.8,
     "follow_distance": 4.0,
     "enemy_height_max": 3.0,
     "enemy_height_min": 0.6,
     "projectile": {
      "prefab": "EnemyProj_1"
     },
     "is_melee": false,
     "is_cannon": false
    }
   },
   "colliders": [
    {
     "kind": "box",
     "trigger": false,
     "enabled": true,
     "offset": {
      "x": 0.00393,
      "y": -0.00393
     },
     "size": {
      "x": 0.787768,
      "y": 1.196511
     }
    }
   ],
   "body": {
    "type": "dynamic",
    "mass": 10.0,
    "gravityScale": 0.0,
    "drag": 0.0,
    "constraints": 0,
    "material": null
   },
   "children": {
    "Graphics": {
     "transform": {
      "pos": {
       "x": 0.0,
       "y": -0.037,
       "z": 0.0
      },
      "scale": {
       "x": 3.0,
       "y": 3.0,
       "z": 1.0
      },
      "rotZ": -179.999656
     },
     "scripts": {}
    },
    "Ice": {
     "transform": {
      "pos": {
       "x": 0.0,
       "y": 0.0,
       "z": -0.0
      },
      "scale": {
       "x": 0.63,
       "y": 0.63,
       "z": 0.63
      },
      "rotZ": 0.0
     },
     "scripts": {
      "ParticleActivator": {},
      "IceController": {}
     }
    }
   }
  },
  "Medium_Ranged": {
   "transform": {
    "pos": {
     "x": 0.0,
     "y": 0.0,
     "z": 0.0
    },
    "scale": {
     "x": 0.8,
     "y": 0.8,
     "z": 0.8
    },
    "rotZ": 0.0
   },
   "layer": 6,
   "scripts": {
    "EnemyStats": {
     "_initialSize": {
      "x": 0.0,
      "y": 0.0,
      "z": 0.0
     },
     "max_hp": 15.0,
     "hp": 0.0,
     "atk_speed": 1.5,
     "atk_damage": 7.0,
     "melee_atk_damage": 2.0,
     "projectile_speed": 0.55,
     "projectile_resistance": 1,
     "fragmenter": {
      "prefab": "Fragmenter"
     },
     "healing_orb": {
      "prefab": "HealingOrb"
     },
     "now_color": {
      "r": 0.0,
      "g": 0.0,
      "b": 0.0,
      "a": 0.0
     },
     "damage_text": {
      "prefab": "DamageText"
     },
     "blood_particles": {
      "prefab": "Blood"
     },
     "projectile_generation": 0,
     "bleed_cooldown": 1.0,
     "bleed_amount": 0.0,
     "souls_orb": {
      "prefab": "SoulOrb"
     },
     "beam_cd": 0.0
    },
    "RangedBehavior": {
     "move_speed": 0.25,
     "initial_move_speed": 0.0,
     "vertical_move_speed": 1.8,
     "follow_distance": 4.0,
     "enemy_height_max": 2.0,
     "enemy_height_min": 0.0,
     "projectile": {
      "prefab": "EnemyProj_2"
     },
     "is_melee": false,
     "is_cannon": false
    }
   },
   "colliders": [
    {
     "kind": "box",
     "trigger": false,
     "enabled": true,
     "offset": {
      "x": 0.00393,
      "y": -0.00393
     },
     "size": {
      "x": 0.787768,
      "y": 1.196511
     }
    }
   ],
   "body": {
    "type": "dynamic",
    "mass": 20.0,
    "gravityScale": 0.0,
    "drag": 0.0,
    "constraints": 0,
    "material": null
   },
   "children": {
    "Graphics": {
     "transform": {
      "pos": {
       "x": 0.0,
       "y": 0.0,
       "z": 0.0
      },
      "scale": {
       "x": 2.3,
       "y": 2.3,
       "z": 1.0
      },
      "rotZ": -179.999656
     },
     "scripts": {}
    },
    "Ice": {
     "transform": {
      "pos": {
       "x": 0.0,
       "y": 0.0,
       "z": -0.0
      },
      "scale": {
       "x": 0.63,
       "y": 0.63,
       "z": 0.63
      },
      "rotZ": 0.0
     },
     "scripts": {
      "ParticleActivator": {},
      "IceController": {}
     }
    }
   }
  },
  "Strong_Ranged": {
   "transform": {
    "pos": {
     "x": 0.0,
     "y": 0.0,
     "z": 0.0
    },
    "scale": {
     "x": 0.9,
     "y": 0.9,
     "z": 1.0
    },
    "rotZ": 0.0
   },
   "layer": 6,
   "scripts": {
    "EnemyStats": {
     "_initialSize": {
      "x": 0.0,
      "y": 0.0,
      "z": 0.0
     },
     "max_hp": 39.0,
     "hp": 0.0,
     "atk_speed": 1.25,
     "atk_damage": 16.0,
     "melee_atk_damage": 4.0,
     "projectile_speed": 0.7,
     "projectile_resistance": 2,
     "fragmenter": {
      "prefab": "Fragmenter"
     },
     "healing_orb": {
      "prefab": "HealingOrb"
     },
     "now_color": {
      "r": 0.0,
      "g": 0.0,
      "b": 0.0,
      "a": 0.0
     },
     "damage_text": {
      "prefab": "DamageText"
     },
     "blood_particles": {
      "prefab": "Blood"
     },
     "projectile_generation": 0,
     "bleed_cooldown": 1.0,
     "bleed_amount": 0.0,
     "souls_orb": {
      "prefab": "SoulOrb"
     },
     "beam_cd": 0.0
    },
    "RangedBehavior": {
     "move_speed": 0.25,
     "initial_move_speed": 0.0,
     "vertical_move_speed": 1.8,
     "follow_distance": 4.0,
     "enemy_height_max": 2.0,
     "enemy_height_min": 0.0,
     "projectile": {
      "prefab": "EnemyProj_4"
     },
     "is_melee": false,
     "is_cannon": false
    }
   },
   "colliders": [
    {
     "kind": "box",
     "trigger": false,
     "enabled": true,
     "offset": {
      "x": 0.00393,
      "y": -0.00393
     },
     "size": {
      "x": 0.787768,
      "y": 1.196511
     }
    }
   ],
   "body": {
    "type": "dynamic",
    "mass": 30.0,
    "gravityScale": 0.0,
    "drag": 0.0,
    "constraints": 0,
    "material": null
   },
   "children": {
    "Graphics": {
     "transform": {
      "pos": {
       "x": 0.0,
       "y": 0.0,
       "z": 0.0
      },
      "scale": {
       "x": 2.3,
       "y": 2.3,
       "z": 1.0
      },
      "rotZ": -179.999656
     },
     "scripts": {}
    },
    "Ice": {
     "transform": {
      "pos": {
       "x": 0.0,
       "y": 0.0,
       "z": -0.0
      },
      "scale": {
       "x": 0.63,
       "y": 0.63,
       "z": 0.63
      },
      "rotZ": 0.0
     },
     "scripts": {
      "ParticleActivator": {},
      "IceController": {}
     }
    }
   }
  },
  "Weak_Melee": {
   "transform": {
    "pos": {
     "x": 0.0,
     "y": 0.0,
     "z": 0.0
    },
    "scale": {
     "x": 0.5,
     "y": 0.5,
     "z": 0.5
    },
    "rotZ": 0.0
   },
   "layer": 6,
   "scripts": {
    "EnemyStats": {
     "_initialSize": {
      "x": 0.0,
      "y": 0.0,
      "z": 0.0
     },
     "max_hp": 13.0,
     "hp": 0.0,
     "atk_speed": 300.0,
     "atk_damage": 1.0,
     "melee_atk_damage": 3.0,
     "projectile_speed": 0.5,
     "projectile_resistance": 1,
     "fragmenter": {
      "prefab": "Fragmenter"
     },
     "healing_orb": {
      "prefab": "HealingOrb"
     },
     "now_color": {
      "r": 0.0,
      "g": 0.0,
      "b": 0.0,
      "a": 0.0
     },
     "damage_text": {
      "prefab": "DamageText"
     },
     "blood_particles": {
      "prefab": "Blood"
     },
     "projectile_generation": 0,
     "bleed_cooldown": 1.0,
     "bleed_amount": 0.0,
     "souls_orb": {
      "prefab": "SoulOrb"
     },
     "beam_cd": 0.0
    },
    "RangedBehavior": {
     "move_speed": 0.75,
     "initial_move_speed": 0.0,
     "vertical_move_speed": 0.8,
     "follow_distance": 0.01,
     "enemy_height_max": -2.5,
     "enemy_height_min": -3.0,
     "projectile": {
      "prefab": "EnemyProj_1"
     },
     "is_melee": true,
     "is_cannon": false
    }
   },
   "colliders": [
    {
     "kind": "box",
     "trigger": false,
     "enabled": true,
     "offset": {
      "x": 0.00393,
      "y": -0.00393
     },
     "size": {
      "x": 0.787768,
      "y": 1.196511
     }
    }
   ],
   "body": {
    "type": "dynamic",
    "mass": 10.0,
    "gravityScale": 0.0,
    "drag": 0.0,
    "constraints": 0,
    "material": null
   },
   "children": {
    "Graphics": {
     "transform": {
      "pos": {
       "x": 0.0,
       "y": 0.0,
       "z": 0.0
      },
      "scale": {
       "x": 2.5,
       "y": 2.5,
       "z": 1.0
      },
      "rotZ": -179.999656
     },
     "scripts": {}
    },
    "Ice": {
     "transform": {
      "pos": {
       "x": 0.0,
       "y": 0.0,
       "z": -0.0
      },
      "scale": {
       "x": 0.63,
       "y": 0.63,
       "z": 0.63
      },
      "rotZ": 0.0
     },
     "scripts": {
      "ParticleActivator": {},
      "IceController": {}
     }
    }
   }
  },
  "Strong_Melee": {
   "transform": {
    "pos": {
     "x": 0.0,
     "y": 0.0,
     "z": 0.0
    },
    "scale": {
     "x": 0.6,
     "y": 0.6,
     "z": 0.6
    },
    "rotZ": 0.0
   },
   "layer": 6,
   "scripts": {
    "EnemyStats": {
     "_initialSize": {
      "x": 0.0,
      "y": 0.0,
      "z": 0.0
     },
     "max_hp": 78.0,
     "hp": 0.0,
     "atk_speed": 300.0,
     "atk_damage": 1.0,
     "melee_atk_damage": 8.0,
     "projectile_speed": 0.5,
     "projectile_resistance": 1,
     "fragmenter": {
      "prefab": "Fragmenter"
     },
     "healing_orb": {
      "prefab": "HealingOrb"
     },
     "now_color": {
      "r": 0.0,
      "g": 0.0,
      "b": 0.0,
      "a": 0.0
     },
     "damage_text": {
      "prefab": "DamageText"
     },
     "blood_particles": {
      "prefab": "Blood"
     },
     "projectile_generation": 0,
     "bleed_cooldown": 1.0,
     "bleed_amount": 0.0,
     "souls_orb": {
      "prefab": "SoulOrb"
     },
     "beam_cd": 0.0
    },
    "RangedBehavior": {
     "move_speed": 0.75,
     "initial_move_speed": 0.0,
     "vertical_move_speed": 0.8,
     "follow_distance": 0.01,
     "enemy_height_max": -2.5,
     "enemy_height_min": -3.0,
     "projectile": {
      "prefab": "EnemyProj_1"
     },
     "is_melee": true,
     "is_cannon": false
    }
   },
   "colliders": [
    {
     "kind": "box",
     "trigger": false,
     "enabled": true,
     "offset": {
      "x": 0.00393,
      "y": -0.00393
     },
     "size": {
      "x": 0.787768,
      "y": 1.196511
     }
    }
   ],
   "body": {
    "type": "dynamic",
    "mass": 30.0,
    "gravityScale": 0.0,
    "drag": 0.0,
    "constraints": 0,
    "material": null
   },
   "children": {
    "Graphics": {
     "transform": {
      "pos": {
       "x": 0.0,
       "y": 0.0,
       "z": 0.0
      },
      "scale": {
       "x": 2.5,
       "y": 2.5,
       "z": 1.0
      },
      "rotZ": -180.0
     },
     "scripts": {}
    },
    "Ice": {
     "transform": {
      "pos": {
       "x": 0.0,
       "y": 0.0,
       "z": -0.0
      },
      "scale": {
       "x": 0.63,
       "y": 0.63,
       "z": 0.63
      },
      "rotZ": 0.0
     },
     "scripts": {
      "ParticleActivator": {},
      "IceController": {}
     }
    }
   }
  },
  "Cannon": {
   "transform": {
    "pos": {
     "x": 0.0,
     "y": 0.0,
     "z": 0.0
    },
    "scale": {
     "x": 0.9,
     "y": 0.9,
     "z": 1.0
    },
    "rotZ": 0.0
   },
   "layer": 6,
   "scripts": {
    "EnemyStats": {
     "_initialSize": {
      "x": 0.0,
      "y": 0.0,
      "z": 0.0
     },
     "max_hp": 39.0,
     "hp": 0.0,
     "atk_speed": 3.0,
     "atk_damage": 19.0,
     "melee_atk_damage": 1.0,
     "projectile_speed": 0.4,
     "projectile_resistance": 3,
     "fragmenter": {
      "prefab": "Fragmenter"
     },
     "healing_orb": {
      "prefab": "HealingOrb"
     },
     "now_color": {
      "r": 0.0,
      "g": 0.0,
      "b": 0.0,
      "a": 0.0
     },
     "damage_text": {
      "prefab": "DamageText"
     },
     "blood_particles": {
      "prefab": "Blood"
     },
     "projectile_generation": 0,
     "bleed_cooldown": 1.0,
     "bleed_amount": 0.0,
     "souls_orb": {
      "prefab": "SoulOrb"
     },
     "beam_cd": 0.0
    },
    "RangedBehavior": {
     "move_speed": 0.25,
     "initial_move_speed": 0.0,
     "vertical_move_speed": 1.8,
     "follow_distance": 6.0,
     "enemy_height_max": 4.6,
     "enemy_height_min": 2.3,
     "projectile": {
      "prefab": "EnemyProj_3"
     },
     "is_melee": false,
     "is_cannon": true
    }
   },
   "colliders": [
    {
     "kind": "box",
     "trigger": false,
     "enabled": true,
     "offset": {
      "x": 0.00393,
      "y": -0.00393
     },
     "size": {
      "x": 0.787768,
      "y": 1.196511
     }
    }
   ],
   "body": {
    "type": "dynamic",
    "mass": 25.0,
    "gravityScale": 0.0,
    "drag": 0.0,
    "constraints": 0,
    "material": null
   },
   "children": {
    "Graphics": {
     "transform": {
      "pos": {
       "x": 0.0,
       "y": 0.0,
       "z": 0.0
      },
      "scale": {
       "x": 2.8,
       "y": 2.8,
       "z": 1.0
      },
      "rotZ": -179.999656
     },
     "scripts": {}
    },
    "Ice": {
     "transform": {
      "pos": {
       "x": 0.0,
       "y": 0.0,
       "z": -0.0
      },
      "scale": {
       "x": 0.63,
       "y": 0.63,
       "z": 0.63
      },
      "rotZ": 0.0
     },
     "scripts": {
      "ParticleActivator": {},
      "IceController": {}
     }
    }
   }
  },
  "Weak_Ranged+": {
   "transform": {
    "pos": {
     "x": 0.0,
     "y": 0.0,
     "z": 0.0
    },
    "scale": {
     "x": 0.5,
     "y": 0.5,
     "z": 0.5
    },
    "rotZ": 0.0
   },
   "layer": 6,
   "scripts": {
    "EnemyStats": {
     "_initialSize": {
      "x": 0.0,
      "y": 0.0,
      "z": 0.0
     },
     "max_hp": 19.0,
     "hp": 0.0,
     "atk_speed": 1.5,
     "atk_damage": 8.0,
     "melee_atk_damage": 2.0,
     "projectile_speed": 0.45,
     "projectile_resistance": 2,
     "fragmenter": {
      "prefab": "Fragmenter"
     },
     "healing_orb": {
      "prefab": "HealingOrb"
     },
     "now_color": {
      "r": 0.0,
      "g": 0.0,
      "b": 0.0,
      "a": 0.0
     },
     "damage_text": {
      "prefab": "DamageText"
     },
     "blood_particles": {
      "prefab": "Blood"
     },
     "projectile_generation": 0,
     "bleed_cooldown": 1.0,
     "bleed_amount": 0.0,
     "souls_orb": {
      "prefab": "SoulOrb"
     },
     "beam_cd": 0.0
    },
    "RangedBehavior": {
     "move_speed": 0.25,
     "initial_move_speed": 0.0,
     "vertical_move_speed": 1.8,
     "follow_distance": 4.0,
     "enemy_height_max": 3.0,
     "enemy_height_min": 0.6,
     "projectile": {
      "prefab": "EnemyProj_1"
     },
     "is_melee": false,
     "is_cannon": false
    }
   },
   "colliders": [
    {
     "kind": "box",
     "trigger": false,
     "enabled": true,
     "offset": {
      "x": 0.00393,
      "y": -0.00393
     },
     "size": {
      "x": 0.787768,
      "y": 1.196511
     }
    }
   ],
   "body": {
    "type": "dynamic",
    "mass": 10.0,
    "gravityScale": 0.0,
    "drag": 0.0,
    "constraints": 0,
    "material": null
   },
   "children": {
    "Graphics": {
     "transform": {
      "pos": {
       "x": 0.0,
       "y": -0.037,
       "z": 0.0
      },
      "scale": {
       "x": 3.0,
       "y": 3.0,
       "z": 1.0
      },
      "rotZ": -179.999656
     },
     "scripts": {}
    },
    "Ice": {
     "transform": {
      "pos": {
       "x": 0.0,
       "y": 0.0,
       "z": -0.0
      },
      "scale": {
       "x": 0.63,
       "y": 0.63,
       "z": 0.63
      },
      "rotZ": 0.0
     },
     "scripts": {
      "ParticleActivator": {},
      "IceController": {}
     }
    }
   }
  },
  "Medium_Ranged+": {
   "transform": {
    "pos": {
     "x": 0.0,
     "y": 0.0,
     "z": 0.0
    },
    "scale": {
     "x": 0.8,
     "y": 0.8,
     "z": 0.8
    },
    "rotZ": 0.0
   },
   "layer": 6,
   "scripts": {
    "EnemyStats": {
     "_initialSize": {
      "x": 0.0,
      "y": 0.0,
      "z": 0.0
     },
     "max_hp": 70.0,
     "hp": 0.0,
     "atk_speed": 1.3,
     "atk_damage": 23.0,
     "melee_atk_damage": 4.0,
     "projectile_speed": 0.6,
     "projectile_resistance": 3,
     "fragmenter": {
      "prefab": "Fragmenter"
     },
     "healing_orb": {
      "prefab": "HealingOrb"
     },
     "now_color": {
      "r": 0.0,
      "g": 0.0,
      "b": 0.0,
      "a": 0.0
     },
     "damage_text": {
      "prefab": "DamageText"
     },
     "blood_particles": {
      "prefab": "Blood"
     },
     "projectile_generation": 0,
     "bleed_cooldown": 1.0,
     "bleed_amount": 0.0,
     "souls_orb": {
      "prefab": "SoulOrb"
     },
     "beam_cd": 0.0
    },
    "RangedBehavior": {
     "move_speed": 0.25,
     "initial_move_speed": 0.0,
     "vertical_move_speed": 1.8,
     "follow_distance": 4.0,
     "enemy_height_max": 2.0,
     "enemy_height_min": 0.0,
     "projectile": {
      "prefab": "EnemyProj_2"
     },
     "is_melee": false,
     "is_cannon": false
    }
   },
   "colliders": [
    {
     "kind": "box",
     "trigger": false,
     "enabled": true,
     "offset": {
      "x": 0.00393,
      "y": -0.00393
     },
     "size": {
      "x": 0.787768,
      "y": 1.196511
     }
    }
   ],
   "body": {
    "type": "dynamic",
    "mass": 20.0,
    "gravityScale": 0.0,
    "drag": 0.0,
    "constraints": 0,
    "material": null
   },
   "children": {
    "Graphics": {
     "transform": {
      "pos": {
       "x": 0.0,
       "y": 0.0,
       "z": 0.0
      },
      "scale": {
       "x": 2.3,
       "y": 2.3,
       "z": 1.0
      },
      "rotZ": -179.999656
     },
     "scripts": {}
    },
    "Ice": {
     "transform": {
      "pos": {
       "x": 0.0,
       "y": 0.0,
       "z": -0.0
      },
      "scale": {
       "x": 0.63,
       "y": 0.63,
       "z": 0.63
      },
      "rotZ": 0.0
     },
     "scripts": {
      "ParticleActivator": {},
      "IceController": {}
     }
    }
   }
  },
  "Strong_Ranged+": {
   "transform": {
    "pos": {
     "x": 0.0,
     "y": 0.0,
     "z": 0.0
    },
    "scale": {
     "x": 0.9,
     "y": 0.9,
     "z": 1.1
    },
    "rotZ": 0.0
   },
   "layer": 6,
   "scripts": {
    "EnemyStats": {
     "_initialSize": {
      "x": 0.0,
      "y": 0.0,
      "z": 0.0
     },
     "max_hp": 117.0,
     "hp": 0.0,
     "atk_speed": 0.95,
     "atk_damage": 46.0,
     "melee_atk_damage": 7.0,
     "projectile_speed": 0.7,
     "projectile_resistance": 5,
     "fragmenter": {
      "prefab": "Fragmenter"
     },
     "healing_orb": {
      "prefab": "HealingOrb"
     },
     "now_color": {
      "r": 0.0,
      "g": 0.0,
      "b": 0.0,
      "a": 0.0
     },
     "damage_text": {
      "prefab": "DamageText"
     },
     "blood_particles": {
      "prefab": "Blood"
     },
     "projectile_generation": 0,
     "bleed_cooldown": 1.0,
     "bleed_amount": 0.0,
     "souls_orb": {
      "prefab": "SoulOrb"
     },
     "beam_cd": 0.0
    },
    "RangedBehavior": {
     "move_speed": 0.25,
     "initial_move_speed": 0.0,
     "vertical_move_speed": 1.8,
     "follow_distance": 4.0,
     "enemy_height_max": 2.0,
     "enemy_height_min": 0.0,
     "projectile": {
      "prefab": "EnemyProj_4"
     },
     "is_melee": false,
     "is_cannon": false
    }
   },
   "colliders": [
    {
     "kind": "box",
     "trigger": false,
     "enabled": true,
     "offset": {
      "x": 0.00393,
      "y": -0.00393
     },
     "size": {
      "x": 0.787768,
      "y": 1.196511
     }
    }
   ],
   "body": {
    "type": "dynamic",
    "mass": 30.0,
    "gravityScale": 0.0,
    "drag": 0.0,
    "constraints": 0,
    "material": null
   },
   "children": {
    "Graphics": {
     "transform": {
      "pos": {
       "x": 0.0,
       "y": 0.0,
       "z": 0.0
      },
      "scale": {
       "x": 2.3,
       "y": 2.3,
       "z": 1.0
      },
      "rotZ": -179.999656
     },
     "scripts": {}
    },
    "Ice": {
     "transform": {
      "pos": {
       "x": 0.0,
       "y": 0.0,
       "z": -0.0
      },
      "scale": {
       "x": 0.63,
       "y": 0.63,
       "z": 0.63
      },
      "rotZ": 0.0
     },
     "scripts": {
      "ParticleActivator": {},
      "IceController": {}
     }
    }
   }
  },
  "Weak_Melee+": {
   "transform": {
    "pos": {
     "x": 0.0,
     "y": 0.0,
     "z": 0.0
    },
    "scale": {
     "x": 0.5,
     "y": 0.5,
     "z": 0.5
    },
    "rotZ": 0.0
   },
   "layer": 6,
   "scripts": {
    "EnemyStats": {
     "_initialSize": {
      "x": 0.0,
      "y": 0.0,
      "z": 0.0
     },
     "max_hp": 39.0,
     "hp": 0.0,
     "atk_speed": 300.0,
     "atk_damage": 1.0,
     "melee_atk_damage": 8.0,
     "projectile_speed": 0.5,
     "projectile_resistance": 1,
     "fragmenter": {
      "prefab": "Fragmenter"
     },
     "healing_orb": {
      "prefab": "HealingOrb"
     },
     "now_color": {
      "r": 0.0,
      "g": 0.0,
      "b": 0.0,
      "a": 0.0
     },
     "damage_text": {
      "prefab": "DamageText"
     },
     "blood_particles": {
      "prefab": "Blood"
     },
     "projectile_generation": 0,
     "bleed_cooldown": 1.0,
     "bleed_amount": 0.0,
     "souls_orb": {
      "prefab": "SoulOrb"
     },
     "beam_cd": 0.0
    },
    "RangedBehavior": {
     "move_speed": 0.75,
     "initial_move_speed": 0.0,
     "vertical_move_speed": 0.8,
     "follow_distance": 0.01,
     "enemy_height_max": -2.5,
     "enemy_height_min": -3.0,
     "projectile": {
      "prefab": "EnemyProj_1"
     },
     "is_melee": true,
     "is_cannon": false
    }
   },
   "colliders": [
    {
     "kind": "box",
     "trigger": false,
     "enabled": true,
     "offset": {
      "x": 0.00393,
      "y": -0.00393
     },
     "size": {
      "x": 0.787768,
      "y": 1.196511
     }
    }
   ],
   "body": {
    "type": "dynamic",
    "mass": 10.0,
    "gravityScale": 0.0,
    "drag": 0.0,
    "constraints": 0,
    "material": null
   },
   "children": {
    "Graphics": {
     "transform": {
      "pos": {
       "x": 0.0,
       "y": 0.0,
       "z": 0.0
      },
      "scale": {
       "x": 2.5,
       "y": 2.5,
       "z": 1.0
      },
      "rotZ": -179.999656
     },
     "scripts": {}
    },
    "Ice": {
     "transform": {
      "pos": {
       "x": 0.0,
       "y": 0.0,
       "z": -0.0
      },
      "scale": {
       "x": 0.63,
       "y": 0.63,
       "z": 0.63
      },
      "rotZ": 0.0
     },
     "scripts": {
      "ParticleActivator": {},
      "IceController": {}
     }
    }
   }
  },
  "Strong_Melee+": {
   "transform": {
    "pos": {
     "x": 0.0,
     "y": 0.0,
     "z": 0.0
    },
    "scale": {
     "x": 0.6,
     "y": 0.6,
     "z": 0.6
    },
    "rotZ": 0.0
   },
   "layer": 6,
   "scripts": {
    "EnemyStats": {
     "_initialSize": {
      "x": 0.0,
      "y": 0.0,
      "z": 0.0
     },
     "max_hp": 234.0,
     "hp": 0.0,
     "atk_speed": 300.0,
     "atk_damage": 1.0,
     "melee_atk_damage": 23.0,
     "projectile_speed": 0.5,
     "projectile_resistance": 1,
     "fragmenter": {
      "prefab": "Fragmenter"
     },
     "healing_orb": {
      "prefab": "HealingOrb"
     },
     "now_color": {
      "r": 0.0,
      "g": 0.0,
      "b": 0.0,
      "a": 0.0
     },
     "damage_text": {
      "prefab": "DamageText"
     },
     "blood_particles": {
      "prefab": "Blood"
     },
     "projectile_generation": 0,
     "bleed_cooldown": 1.0,
     "bleed_amount": 0.0,
     "souls_orb": {
      "prefab": "SoulOrb"
     },
     "beam_cd": 0.0
    },
    "RangedBehavior": {
     "move_speed": 0.75,
     "initial_move_speed": 0.0,
     "vertical_move_speed": 0.8,
     "follow_distance": 0.01,
     "enemy_height_max": -2.5,
     "enemy_height_min": -3.0,
     "projectile": {
      "prefab": "EnemyProj_1"
     },
     "is_melee": true,
     "is_cannon": false
    }
   },
   "colliders": [
    {
     "kind": "box",
     "trigger": false,
     "enabled": true,
     "offset": {
      "x": 0.00393,
      "y": -0.00393
     },
     "size": {
      "x": 0.787768,
      "y": 1.196511
     }
    }
   ],
   "body": {
    "type": "dynamic",
    "mass": 30.0,
    "gravityScale": 0.0,
    "drag": 0.0,
    "constraints": 0,
    "material": null
   },
   "children": {
    "Graphics": {
     "transform": {
      "pos": {
       "x": 0.0,
       "y": 0.0,
       "z": 0.0
      },
      "scale": {
       "x": 2.5,
       "y": 2.5,
       "z": 1.0
      },
      "rotZ": -180.0
     },
     "scripts": {}
    },
    "Ice": {
     "transform": {
      "pos": {
       "x": 0.0,
       "y": 0.0,
       "z": -0.0
      },
      "scale": {
       "x": 0.63,
       "y": 0.63,
       "z": 0.63
      },
      "rotZ": 0.0
     },
     "scripts": {
      "ParticleActivator": {},
      "IceController": {}
     }
    }
   }
  },
  "Cannon+": {
   "transform": {
    "pos": {
     "x": 0.0,
     "y": 0.0,
     "z": 0.0
    },
    "scale": {
     "x": 0.9,
     "y": 0.9,
     "z": 1.0
    },
    "rotZ": 0.0
   },
   "layer": 6,
   "scripts": {
    "EnemyStats": {
     "_initialSize": {
      "x": 0.0,
      "y": 0.0,
      "z": 0.0
     },
     "max_hp": 117.0,
     "hp": 0.0,
     "atk_speed": 2.5,
     "atk_damage": 58.0,
     "melee_atk_damage": 1.0,
     "projectile_speed": 0.4,
     "projectile_resistance": 6,
     "fragmenter": {
      "prefab": "Fragmenter"
     },
     "healing_orb": {
      "prefab": "HealingOrb"
     },
     "now_color": {
      "r": 0.0,
      "g": 0.0,
      "b": 0.0,
      "a": 0.0
     },
     "damage_text": {
      "prefab": "DamageText"
     },
     "blood_particles": {
      "prefab": "Blood"
     },
     "projectile_generation": 0,
     "bleed_cooldown": 1.0,
     "bleed_amount": 0.0,
     "souls_orb": {
      "prefab": "SoulOrb"
     },
     "beam_cd": 0.0
    },
    "RangedBehavior": {
     "move_speed": 0.25,
     "initial_move_speed": 0.0,
     "vertical_move_speed": 1.8,
     "follow_distance": 6.0,
     "enemy_height_max": 4.6,
     "enemy_height_min": 2.3,
     "projectile": {
      "prefab": "EnemyProj_3"
     },
     "is_melee": false,
     "is_cannon": true
    }
   },
   "colliders": [
    {
     "kind": "box",
     "trigger": false,
     "enabled": true,
     "offset": {
      "x": 0.00393,
      "y": -0.00393
     },
     "size": {
      "x": 0.787768,
      "y": 1.196511
     }
    }
   ],
   "body": {
    "type": "dynamic",
    "mass": 25.0,
    "gravityScale": 0.0,
    "drag": 0.0,
    "constraints": 0,
    "material": null
   },
   "children": {
    "Graphics": {
     "transform": {
      "pos": {
       "x": 0.0,
       "y": 0.0,
       "z": 0.0
      },
      "scale": {
       "x": 2.8,
       "y": 2.8,
       "z": 1.0
      },
      "rotZ": -179.999656
     },
     "scripts": {}
    },
    "Ice": {
     "transform": {
      "pos": {
       "x": 0.0,
       "y": 0.0,
       "z": -0.0
      },
      "scale": {
       "x": 0.63,
       "y": 0.63,
       "z": 0.63
      },
      "rotZ": 0.0
     },
     "scripts": {
      "ParticleActivator": {},
      "IceController": {}
     }
    }
   }
  },
  "Weak_Ranged++": {
   "transform": {
    "pos": {
     "x": 0.0,
     "y": 0.0,
     "z": 0.0
    },
    "scale": {
     "x": 0.5,
     "y": 0.5,
     "z": 0.5
    },
    "rotZ": 0.0
   },
   "layer": 6,
   "scripts": {
    "EnemyStats": {
     "_initialSize": {
      "x": 0.0,
      "y": 0.0,
      "z": 0.0
     },
     "max_hp": 58.0,
     "hp": 0.0,
     "atk_speed": 1.25,
     "atk_damage": 23.0,
     "melee_atk_damage": 6.0,
     "projectile_speed": 0.45,
     "projectile_resistance": 3,
     "fragmenter": {
      "prefab": "Fragmenter"
     },
     "healing_orb": {
      "prefab": "HealingOrb"
     },
     "now_color": {
      "r": 0.0,
      "g": 0.0,
      "b": 0.0,
      "a": 0.0
     },
     "damage_text": {
      "prefab": "DamageText"
     },
     "blood_particles": {
      "prefab": "Blood"
     },
     "projectile_generation": 0,
     "bleed_cooldown": 1.0,
     "bleed_amount": 0.0,
     "souls_orb": {
      "prefab": "SoulOrb"
     },
     "beam_cd": 0.0
    },
    "RangedBehavior": {
     "move_speed": 0.25,
     "initial_move_speed": 0.0,
     "vertical_move_speed": 1.8,
     "follow_distance": 4.0,
     "enemy_height_max": 3.0,
     "enemy_height_min": 0.6,
     "projectile": {
      "prefab": "EnemyProj_1"
     },
     "is_melee": false,
     "is_cannon": false
    }
   },
   "colliders": [
    {
     "kind": "box",
     "trigger": false,
     "enabled": true,
     "offset": {
      "x": 0.00393,
      "y": -0.00393
     },
     "size": {
      "x": 0.787768,
      "y": 1.196511
     }
    }
   ],
   "body": {
    "type": "dynamic",
    "mass": 10.0,
    "gravityScale": 0.0,
    "drag": 0.0,
    "constraints": 0,
    "material": null
   },
   "children": {
    "Graphics": {
     "transform": {
      "pos": {
       "x": 0.0,
       "y": -0.037,
       "z": 0.0
      },
      "scale": {
       "x": 3.0,
       "y": 3.0,
       "z": 1.0
      },
      "rotZ": -179.999656
     },
     "scripts": {}
    },
    "Ice": {
     "transform": {
      "pos": {
       "x": 0.0,
       "y": 0.0,
       "z": -0.0
      },
      "scale": {
       "x": 0.63,
       "y": 0.63,
       "z": 0.63
      },
      "rotZ": 0.0
     },
     "scripts": {
      "ParticleActivator": {},
      "IceController": {}
     }
    }
   }
  },
  "Medium_Ranged++": {
   "transform": {
    "pos": {
     "x": 0.0,
     "y": 0.0,
     "z": 0.0
    },
    "scale": {
     "x": 0.8,
     "y": 0.8,
     "z": 0.8
    },
    "rotZ": 0.0
   },
   "layer": 6,
   "scripts": {
    "EnemyStats": {
     "_initialSize": {
      "x": 0.0,
      "y": 0.0,
      "z": 0.0
     },
     "max_hp": 195.0,
     "hp": 0.0,
     "atk_speed": 1.3,
     "atk_damage": 41.0,
     "melee_atk_damage": 8.0,
     "projectile_speed": 0.6,
     "projectile_resistance": 4,
     "fragmenter": {
      "prefab": "Fragmenter"
     },
     "healing_orb": {
      "prefab": "HealingOrb"
     },
     "now_color": {
      "r": 0.0,
      "g": 0.0,
      "b": 0.0,
      "a": 0.0
     },
     "damage_text": {
      "prefab": "DamageText"
     },
     "blood_particles": {
      "prefab": "Blood"
     },
     "projectile_generation": 0,
     "bleed_cooldown": 1.0,
     "bleed_amount": 0.0,
     "souls_orb": {
      "prefab": "SoulOrb"
     },
     "beam_cd": 0.0
    },
    "RangedBehavior": {
     "move_speed": 0.25,
     "initial_move_speed": 0.0,
     "vertical_move_speed": 1.8,
     "follow_distance": 4.0,
     "enemy_height_max": 2.0,
     "enemy_height_min": 0.0,
     "projectile": {
      "prefab": "EnemyProj_2"
     },
     "is_melee": false,
     "is_cannon": false
    }
   },
   "colliders": [
    {
     "kind": "box",
     "trigger": false,
     "enabled": true,
     "offset": {
      "x": 0.00393,
      "y": -0.00393
     },
     "size": {
      "x": 0.787768,
      "y": 1.196511
     }
    }
   ],
   "body": {
    "type": "dynamic",
    "mass": 20.0,
    "gravityScale": 0.0,
    "drag": 0.0,
    "constraints": 0,
    "material": null
   },
   "children": {
    "Graphics": {
     "transform": {
      "pos": {
       "x": 0.0,
       "y": 0.0,
       "z": 0.0
      },
      "scale": {
       "x": 2.3,
       "y": 2.3,
       "z": 1.0
      },
      "rotZ": -179.999656
     },
     "scripts": {}
    },
    "Ice": {
     "transform": {
      "pos": {
       "x": 0.0,
       "y": 0.0,
       "z": -0.0
      },
      "scale": {
       "x": 0.63,
       "y": 0.63,
       "z": 0.63
      },
      "rotZ": 0.0
     },
     "scripts": {
      "ParticleActivator": {},
      "IceController": {}
     }
    }
   }
  },
  "Strong_Ranged++": {
   "transform": {
    "pos": {
     "x": 0.0,
     "y": 0.0,
     "z": 0.0
    },
    "scale": {
     "x": 0.9,
     "y": 0.9,
     "z": 1.1
    },
    "rotZ": 0.0
   },
   "layer": 6,
   "scripts": {
    "EnemyStats": {
     "_initialSize": {
      "x": 0.0,
      "y": 0.0,
      "z": 0.0
     },
     "max_hp": 350.0,
     "hp": 0.0,
     "atk_speed": 0.95,
     "atk_damage": 88.0,
     "melee_atk_damage": 12.0,
     "projectile_speed": 0.7,
     "projectile_resistance": 7,
     "fragmenter": {
      "prefab": "Fragmenter"
     },
     "healing_orb": {
      "prefab": "HealingOrb"
     },
     "now_color": {
      "r": 0.0,
      "g": 0.0,
      "b": 0.0,
      "a": 0.0
     },
     "damage_text": {
      "prefab": "DamageText"
     },
     "blood_particles": {
      "prefab": "Blood"
     },
     "projectile_generation": 0,
     "bleed_cooldown": 1.0,
     "bleed_amount": 0.0,
     "souls_orb": {
      "prefab": "SoulOrb"
     },
     "beam_cd": 0.0
    },
    "RangedBehavior": {
     "move_speed": 0.25,
     "initial_move_speed": 0.0,
     "vertical_move_speed": 1.8,
     "follow_distance": 4.0,
     "enemy_height_max": 2.0,
     "enemy_height_min": 0.0,
     "projectile": {
      "prefab": "EnemyProj_4"
     },
     "is_melee": false,
     "is_cannon": false
    }
   },
   "colliders": [
    {
     "kind": "box",
     "trigger": false,
     "enabled": true,
     "offset": {
      "x": 0.00393,
      "y": -0.00393
     },
     "size": {
      "x": 0.787768,
      "y": 1.196511
     }
    }
   ],
   "body": {
    "type": "dynamic",
    "mass": 30.0,
    "gravityScale": 0.0,
    "drag": 0.0,
    "constraints": 0,
    "material": null
   },
   "children": {
    "Graphics": {
     "transform": {
      "pos": {
       "x": 0.0,
       "y": 0.0,
       "z": 0.0
      },
      "scale": {
       "x": 2.3,
       "y": 2.3,
       "z": 1.0
      },
      "rotZ": -179.999656
     },
     "scripts": {}
    },
    "Ice": {
     "transform": {
      "pos": {
       "x": 0.0,
       "y": 0.0,
       "z": -0.0
      },
      "scale": {
       "x": 0.63,
       "y": 0.63,
       "z": 0.63
      },
      "rotZ": 0.0
     },
     "scripts": {
      "ParticleActivator": {},
      "IceController": {}
     }
    }
   }
  },
  "Weak_Melee++": {
   "transform": {
    "pos": {
     "x": 0.0,
     "y": 0.0,
     "z": 0.0
    },
    "scale": {
     "x": 0.5,
     "y": 0.5,
     "z": 0.5
    },
    "rotZ": 0.0
   },
   "layer": 6,
   "scripts": {
    "EnemyStats": {
     "_initialSize": {
      "x": 0.0,
      "y": 0.0,
      "z": 0.0
     },
     "max_hp": 117.0,
     "hp": 0.0,
     "atk_speed": 300.0,
     "atk_damage": 1.0,
     "melee_atk_damage": 23.0,
     "projectile_speed": 0.5,
     "projectile_resistance": 1,
     "fragmenter": {
      "prefab": "Fragmenter"
     },
     "healing_orb": {
      "prefab": "HealingOrb"
     },
     "now_color": {
      "r": 0.0,
      "g": 0.0,
      "b": 0.0,
      "a": 0.0
     },
     "damage_text": {
      "prefab": "DamageText"
     },
     "blood_particles": {
      "prefab": "Blood"
     },
     "projectile_generation": 0,
     "bleed_cooldown": 1.0,
     "bleed_amount": 0.0,
     "souls_orb": {
      "prefab": "SoulOrb"
     },
     "beam_cd": 0.0
    },
    "RangedBehavior": {
     "move_speed": 0.75,
     "initial_move_speed": 0.0,
     "vertical_move_speed": 0.8,
     "follow_distance": 0.01,
     "enemy_height_max": -2.5,
     "enemy_height_min": -3.0,
     "projectile": {
      "prefab": "EnemyProj_1"
     },
     "is_melee": true,
     "is_cannon": false
    }
   },
   "colliders": [
    {
     "kind": "box",
     "trigger": false,
     "enabled": true,
     "offset": {
      "x": 0.00393,
      "y": -0.00393
     },
     "size": {
      "x": 0.787768,
      "y": 1.196511
     }
    }
   ],
   "body": {
    "type": "dynamic",
    "mass": 10.0,
    "gravityScale": 0.0,
    "drag": 0.0,
    "constraints": 0,
    "material": null
   },
   "children": {
    "Graphics": {
     "transform": {
      "pos": {
       "x": 0.0,
       "y": 0.0,
       "z": 0.0
      },
      "scale": {
       "x": 2.5,
       "y": 2.5,
       "z": 1.0
      },
      "rotZ": -179.999656
     },
     "scripts": {}
    },
    "Ice": {
     "transform": {
      "pos": {
       "x": 0.0,
       "y": 0.0,
       "z": -0.0
      },
      "scale": {
       "x": 0.63,
       "y": 0.63,
       "z": 0.63
      },
      "rotZ": 0.0
     },
     "scripts": {
      "ParticleActivator": {},
      "IceController": {}
     }
    }
   }
  },
  "Strong_Melee++": {
   "transform": {
    "pos": {
     "x": 0.0,
     "y": 0.0,
     "z": 0.0
    },
    "scale": {
     "x": 0.6,
     "y": 0.6,
     "z": 0.6
    },
    "rotZ": 0.0
   },
   "layer": 6,
   "scripts": {
    "EnemyStats": {
     "_initialSize": {
      "x": 0.0,
      "y": 0.0,
      "z": 0.0
     },
     "max_hp": 700.0,
     "hp": 0.0,
     "atk_speed": 300.0,
     "atk_damage": 1.0,
     "melee_atk_damage": 52.0,
     "projectile_speed": 0.5,
     "projectile_resistance": 1,
     "fragmenter": {
      "prefab": "Fragmenter"
     },
     "healing_orb": {
      "prefab": "HealingOrb"
     },
     "now_color": {
      "r": 0.0,
      "g": 0.0,
      "b": 0.0,
      "a": 0.0
     },
     "damage_text": {
      "prefab": "DamageText"
     },
     "blood_particles": {
      "prefab": "Blood"
     },
     "projectile_generation": 0,
     "bleed_cooldown": 1.0,
     "bleed_amount": 0.0,
     "souls_orb": {
      "prefab": "SoulOrb"
     },
     "beam_cd": 0.0
    },
    "RangedBehavior": {
     "move_speed": 0.75,
     "initial_move_speed": 0.0,
     "vertical_move_speed": 0.8,
     "follow_distance": 0.01,
     "enemy_height_max": -2.5,
     "enemy_height_min": -3.0,
     "projectile": {
      "prefab": "EnemyProj_1"
     },
     "is_melee": true,
     "is_cannon": false
    }
   },
   "colliders": [
    {
     "kind": "box",
     "trigger": false,
     "enabled": true,
     "offset": {
      "x": 0.00393,
      "y": -0.00393
     },
     "size": {
      "x": 0.787768,
      "y": 1.196511
     }
    }
   ],
   "body": {
    "type": "dynamic",
    "mass": 30.0,
    "gravityScale": 0.0,
    "drag": 0.0,
    "constraints": 0,
    "material": null
   },
   "children": {
    "Graphics": {
     "transform": {
      "pos": {
       "x": 0.0,
       "y": 0.0,
       "z": 0.0
      },
      "scale": {
       "x": 2.5,
       "y": 2.5,
       "z": 1.0
      },
      "rotZ": -180.0
     },
     "scripts": {}
    },
    "Ice": {
     "transform": {
      "pos": {
       "x": 0.0,
       "y": 0.0,
       "z": -0.0
      },
      "scale": {
       "x": 0.63,
       "y": 0.63,
       "z": 0.63
      },
      "rotZ": 0.0
     },
     "scripts": {
      "ParticleActivator": {},
      "IceController": {}
     }
    }
   }
  },
  "Cannon++": {
   "transform": {
    "pos": {
     "x": 0.0,
     "y": 0.0,
     "z": 0.0
    },
    "scale": {
     "x": 0.9,
     "y": 0.9,
     "z": 1.0
    },
    "rotZ": 0.0
   },
   "layer": 6,
   "scripts": {
    "EnemyStats": {
     "_initialSize": {
      "x": 0.0,
      "y": 0.0,
      "z": 0.0
     },
     "max_hp": 350.0,
     "hp": 0.0,
     "atk_speed": 2.35,
     "atk_damage": 117.0,
     "melee_atk_damage": 1.0,
     "projectile_speed": 0.4,
     "projectile_resistance": 6,
     "fragmenter": {
      "prefab": "Fragmenter"
     },
     "healing_orb": {
      "prefab": "HealingOrb"
     },
     "now_color": {
      "r": 0.0,
      "g": 0.0,
      "b": 0.0,
      "a": 0.0
     },
     "damage_text": {
      "prefab": "DamageText"
     },
     "blood_particles": {
      "prefab": "Blood"
     },
     "projectile_generation": 0,
     "bleed_cooldown": 1.0,
     "bleed_amount": 0.0,
     "souls_orb": {
      "prefab": "SoulOrb"
     },
     "beam_cd": 0.0
    },
    "RangedBehavior": {
     "move_speed": 0.25,
     "initial_move_speed": 0.0,
     "vertical_move_speed": 1.8,
     "follow_distance": 6.0,
     "enemy_height_max": 3.9,
     "enemy_height_min": 1.0,
     "projectile": {
      "prefab": "EnemyProj_3"
     },
     "is_melee": false,
     "is_cannon": false
    }
   },
   "colliders": [
    {
     "kind": "box",
     "trigger": false,
     "enabled": true,
     "offset": {
      "x": 0.00393,
      "y": -0.00393
     },
     "size": {
      "x": 0.787768,
      "y": 1.196511
     }
    }
   ],
   "body": {
    "type": "dynamic",
    "mass": 25.0,
    "gravityScale": 0.0,
    "drag": 0.0,
    "constraints": 0,
    "material": null
   },
   "children": {
    "Graphics": {
     "transform": {
      "pos": {
       "x": 0.0,
       "y": 0.0,
       "z": 0.0
      },
      "scale": {
       "x": 2.8,
       "y": 2.8,
       "z": 1.0
      },
      "rotZ": -179.999656
     },
     "scripts": {}
    },
    "Ice": {
     "transform": {
      "pos": {
       "x": 0.0,
       "y": 0.0,
       "z": -0.0
      },
      "scale": {
       "x": 0.63,
       "y": 0.63,
       "z": 0.63
      },
      "rotZ": 0.0
     },
     "scripts": {
      "ParticleActivator": {},
      "IceController": {}
     }
    }
   }
  },
  "Weak_Ranged_END": {
   "transform": {
    "pos": {
     "x": 0.0,
     "y": 0.0,
     "z": 0.0
    },
    "scale": {
     "x": 1.0,
     "y": 1.0,
     "z": 0.5
    },
    "rotZ": 0.0
   },
   "layer": 6,
   "scripts": {
    "EnemyStats": {
     "_initialSize": {
      "x": 0.0,
      "y": 0.0,
      "z": 0.0
     },
     "max_hp": 1000.0,
     "hp": 0.0,
     "atk_speed": 0.6,
     "atk_damage": 200.0,
     "melee_atk_damage": 100.0,
     "projectile_speed": 0.9,
     "projectile_resistance": 21,
     "fragmenter": {
      "prefab": "Fragmenter"
     },
     "healing_orb": {
      "prefab": "HealingOrb"
     },
     "now_color": {
      "r": 0.0,
      "g": 0.0,
      "b": 0.0,
      "a": 0.0
     },
     "damage_text": {
      "prefab": "DamageText"
     },
     "blood_particles": {
      "prefab": "Blood"
     },
     "projectile_generation": 0,
     "bleed_cooldown": 1.0,
     "bleed_amount": 0.0,
     "souls_orb": {
      "prefab": "SoulOrb"
     },
     "beam_cd": 0.0
    },
    "RangedBehavior": {
     "move_speed": 0.25,
     "initial_move_speed": 0.0,
     "vertical_move_speed": 1.8,
     "follow_distance": 4.0,
     "enemy_height_max": 3.0,
     "enemy_height_min": 0.6,
     "projectile": {
      "prefab": "EnemyProj_1"
     },
     "is_melee": false,
     "is_cannon": false
    }
   },
   "colliders": [
    {
     "kind": "box",
     "trigger": false,
     "enabled": true,
     "offset": {
      "x": 0.00393,
      "y": -0.00393
     },
     "size": {
      "x": 0.787768,
      "y": 1.196511
     }
    }
   ],
   "body": {
    "type": "dynamic",
    "mass": 10.0,
    "gravityScale": 0.0,
    "drag": 0.0,
    "constraints": 0,
    "material": null
   },
   "children": {
    "Graphics": {
     "transform": {
      "pos": {
       "x": 0.0,
       "y": -0.037,
       "z": 0.0
      },
      "scale": {
       "x": 3.0,
       "y": 3.0,
       "z": 1.0
      },
      "rotZ": -179.999656
     },
     "scripts": {}
    },
    "Ice": {
     "transform": {
      "pos": {
       "x": 0.0,
       "y": 0.0,
       "z": -0.0
      },
      "scale": {
       "x": 0.63,
       "y": 0.63,
       "z": 0.63
      },
      "rotZ": 0.0
     },
     "scripts": {
      "ParticleActivator": {},
      "IceController": {}
     }
    }
   }
  },
  "Boss1": {
   "transform": {
    "pos": {
     "x": 0.0,
     "y": 0.0,
     "z": 0.0
    },
    "scale": {
     "x": 3.0,
     "y": 3.0,
     "z": 1.0
    },
    "rotZ": 0.0
   },
   "layer": 6,
   "scripts": {
    "EnemyStats": {
     "_initialSize": {
      "x": 0.0,
      "y": 0.0,
      "z": 0.0
     },
     "max_hp": 1800.0,
     "hp": 1800.0,
     "atk_speed": 1.0,
     "atk_damage": 20.0,
     "melee_atk_damage": 5.0,
     "projectile_speed": 0.55,
     "projectile_resistance": 10,
     "fragmenter": {
      "prefab": "Fragmenter"
     },
     "healing_orb": {
      "prefab": "HealingOrb"
     },
     "now_color": {
      "r": 0.0,
      "g": 0.0,
      "b": 0.0,
      "a": 0.0
     },
     "damage_text": {
      "prefab": "DamageText"
     },
     "blood_particles": {
      "prefab": "Blood"
     },
     "projectile_generation": 0,
     "bleed_cooldown": 1.0,
     "bleed_amount": 0.0,
     "souls_orb": {
      "prefab": "SoulOrb"
     },
     "beam_cd": 0.0
    },
    "RangedBehavior": {
     "move_speed": 0.15,
     "initial_move_speed": 0.0,
     "vertical_move_speed": 1.8,
     "follow_distance": 2.0,
     "enemy_height_max": 3.5,
     "enemy_height_min": 2.0,
     "projectile": {
      "prefab": "EnemyProj_4"
     },
     "is_melee": false,
     "is_cannon": false
    },
    "Boss1": {
     "bomb": {
      "prefab": "BossBomb"
     },
     "attack_speed": 2.0
    }
   },
   "colliders": [
    {
     "kind": "box",
     "trigger": false,
     "enabled": true,
     "offset": {
      "x": 0.00393,
      "y": 0.002918
     },
     "size": {
      "x": 0.787768,
      "y": 0.434074
     }
    }
   ],
   "body": {
    "type": "dynamic",
    "mass": 100.0,
    "gravityScale": 0.0,
    "drag": 0.0,
    "constraints": 0,
    "material": null
   },
   "children": {
    "Graphics": {
     "transform": {
      "pos": {
       "x": 0.0,
       "y": 0.0,
       "z": 0.0
      },
      "scale": {
       "x": 1.0,
       "y": 1.0,
       "z": 1.0
      },
      "rotZ": -179.999656
     },
     "scripts": {}
    },
    "Ice": {
     "transform": {
      "pos": {
       "x": 0.0,
       "y": 0.0,
       "z": -0.0
      },
      "scale": {
       "x": 0.63,
       "y": 0.63,
       "z": 0.63
      },
      "rotZ": 0.0
     },
     "scripts": {
      "ParticleActivator": {},
      "IceController": {}
     }
    }
   }
  },
  "Boss2": {
   "transform": {
    "pos": {
     "x": 0.0,
     "y": 0.0,
     "z": 0.0
    },
    "scale": {
     "x": 4.0,
     "y": 4.0,
     "z": 1.0
    },
    "rotZ": 0.0
   },
   "layer": 6,
   "scripts": {
    "Boss2": {
     "generation": 1
    },
    "EnemyStats": {
     "_initialSize": {
      "x": 0.0,
      "y": 0.0,
      "z": 0.0
     },
     "max_hp": 12000.0,
     "hp": 12000.0,
     "atk_speed": 0.5,
     "atk_damage": 140.0,
     "melee_atk_damage": 12.0,
     "projectile_speed": 0.7,
     "projectile_resistance": 5,
     "fragmenter": {
      "prefab": "Fragmenter"
     },
     "healing_orb": {
      "prefab": "HealingOrb"
     },
     "now_color": {
      "r": 0.0,
      "g": 0.0,
      "b": 0.0,
      "a": 0.0
     },
     "damage_text": {
      "prefab": "DamageText"
     },
     "blood_particles": {
      "prefab": "Blood"
     },
     "projectile_generation": 0,
     "bleed_cooldown": 1.0,
     "bleed_amount": 0.0,
     "souls_orb": {
      "prefab": "SoulOrb"
     },
     "beam_cd": 0.0
    },
    "RangedBehavior": {
     "move_speed": 0.3,
     "initial_move_speed": 0.0,
     "vertical_move_speed": 1.8,
     "follow_distance": 2.0,
     "enemy_height_max": 3.0,
     "enemy_height_min": 1.0,
     "projectile": {
      "prefab": "EnemyProj_4"
     },
     "is_melee": false,
     "is_cannon": false
    }
   },
   "colliders": [
    {
     "kind": "box",
     "trigger": false,
     "enabled": true,
     "offset": {
      "x": 0.00393,
      "y": 0.002918
     },
     "size": {
      "x": 0.787768,
      "y": 0.434074
     }
    }
   ],
   "body": {
    "type": "dynamic",
    "mass": 100.0,
    "gravityScale": 0.0,
    "drag": 0.0,
    "constraints": 0,
    "material": null
   },
   "children": {
    "Graphics": {
     "transform": {
      "pos": {
       "x": 0.0,
       "y": 0.0,
       "z": 0.0
      },
      "scale": {
       "x": 1.0,
       "y": 1.0,
       "z": 1.0
      },
      "rotZ": -179.999656
     },
     "scripts": {}
    },
    "Ice": {
     "transform": {
      "pos": {
       "x": 0.0,
       "y": 0.0,
       "z": -0.0
      },
      "scale": {
       "x": 0.63,
       "y": 0.63,
       "z": 0.63
      },
      "rotZ": 0.0
     },
     "scripts": {
      "ParticleActivator": {},
      "IceController": {}
     }
    }
   }
  },
  "LeaderboardStoreScore": {
   "transform": {
    "pos": {
     "x": 0.0,
     "y": 0.0,
     "z": 0.0
    },
    "scale": {
     "x": 1.0,
     "y": 1.0,
     "z": 1.0
    },
    "rotZ": 0.0
   },
   "layer": 0,
   "scripts": {
    "LB_StoreScore": {}
   }
  },
  "LeaderboardChangeUsername": {
   "transform": {
    "pos": {
     "x": 1367.142334,
     "y": 318.81723,
     "z": -997.691528
    },
    "scale": {
     "x": 1.0,
     "y": 1.0,
     "z": 1.0
    },
    "rotZ": 0.0
   },
   "layer": 0,
   "scripts": {
    "LB_ChangeUsername": {}
   }
  },
  "ProjectileExplode": {
   "transform": {
    "pos": {
     "x": 0.0,
     "y": 0.0,
     "z": 0.0
    },
    "scale": {
     "x": 1.0,
     "y": 1.0,
     "z": 1.0
    },
    "rotZ": -0.0
   },
   "layer": 0,
   "scripts": {
    "ParticleActivator": {}
   }
  },
  "ExplosiveProjectileExplode": {
   "transform": {
    "pos": {
     "x": 0.0,
     "y": 0.0,
     "z": 0.0
    },
    "scale": {
     "x": 1.0,
     "y": 1.0,
     "z": 1.0
    },
    "rotZ": -0.0
   },
   "layer": 0,
   "scripts": {
    "ParticleActivator": {}
   }
  },
  "BlackHole": {
   "transform": {
    "pos": {
     "x": 2.94,
     "y": 0.0,
     "z": 0.0
    },
    "scale": {
     "x": 0.3,
     "y": 0.3,
     "z": 0.3
    },
    "rotZ": 0.0
   },
   "layer": 0,
   "scripts": {
    "BlackHole": {}
   },
   "children": {
    "Particle System": {
     "transform": {
      "pos": {
       "x": 0.02,
       "y": -0.08,
       "z": 0.0
      },
      "scale": {
       "x": 1.0,
       "y": 1.0,
       "z": 1.0
      },
      "rotZ": -314.975037
     },
     "scripts": {
      "ParticleActivator": {}
     }
    }
   }
  },
  "Transcendence": {
   "transform": {
    "pos": {
     "x": 0.0,
     "y": 0.0,
     "z": 0.0
    },
    "scale": {
     "x": 1.0,
     "y": 1.0,
     "z": 1.0
    },
    "rotZ": 0.0
   },
   "layer": 5,
   "scripts": {
    "Transcendence": {
     "button": {
      "prefab": "Transcendence"
     },
     "title_name": {
      "prefab": "Transcendence"
     },
     "title_color": {
      "r": 0.0,
      "g": 0.0,
      "b": 0.0,
      "a": 0.0
     },
     "card_name": {
      "prefab": "Transcendence"
     },
     "card_description": {
      "prefab": "Transcendence"
     },
     "card_icon": {
      "prefab": "Transcendence"
     }
    },
    "UnityEngine.UI.Image": {
     "m_Color": {
      "r": 1.0,
      "g": 1.0,
      "b": 1.0,
      "a": 0.0
     },
     "m_RaycastTarget": true,
     "m_RaycastPadding": {
      "x": 0.0,
      "y": 0.0,
      "z": 0.0,
      "w": 0.0
     },
     "m_Maskable": true,
     "m_Type": 0,
     "m_PreserveAspect": false,
     "m_FillCenter": true,
     "m_FillMethod": 4,
     "m_FillAmount": 1.0,
     "m_FillClockwise": true,
     "m_FillOrigin": 0,
     "m_UseSpriteMesh": false,
     "m_PixelsPerUnitMultiplier": 1.0
    }
   },
   "children": {
    "TranscendenceLight": {
     "transform": {
      "pos": {
       "x": 0.0,
       "y": 0.0,
       "z": 0.0
      },
      "scale": {
       "x": 1.0,
       "y": 1.0,
       "z": 1.0
      },
      "rotZ": -0.0
     },
     "scripts": {
      "UnityEngine.UI.Image": {
       "m_Color": {
        "r": 1.0,
        "g": 1.0,
        "b": 1.0,
        "a": 0.537255
       },
       "m_RaycastTarget": true,
       "m_RaycastPadding": {
        "x": 0.0,
        "y": 0.0,
        "z": 0.0,
        "w": 0.0
       },
       "m_Maskable": true,
       "m_Type": 0,
       "m_PreserveAspect": true,
       "m_FillCenter": true,
       "m_FillMethod": 4,
       "m_FillAmount": 1.0,
       "m_FillClockwise": true,
       "m_FillOrigin": 0,
       "m_UseSpriteMesh": false,
       "m_PixelsPerUnitMultiplier": 1.0
      }
     }
    },
    "ShopCard": {
     "transform": {
      "pos": {
       "x": 0.0,
       "y": 0.0,
       "z": 0.0
      },
      "scale": {
       "x": 0.85,
       "y": 0.85,
       "z": 0.85
      },
      "rotZ": -0.0
     },
     "scripts": {
      "UnityEngine.UI.Image": {
       "m_Color": {
        "r": 0.0,
        "g": 0.0,
        "b": 0.0,
        "a": 1.0
       },
       "m_RaycastTarget": true,
       "m_RaycastPadding": {
        "x": 0.0,
        "y": 0.0,
        "z": 0.0,
        "w": 0.0
       },
       "m_Maskable": true,
       "m_Type": 0,
       "m_PreserveAspect": false,
       "m_FillCenter": true,
       "m_FillMethod": 4,
       "m_FillAmount": 1.0,
       "m_FillClockwise": true,
       "m_FillOrigin": 0,
       "m_UseSpriteMesh": false,
       "m_PixelsPerUnitMultiplier": 1.0
      },
      "UnityEngine.UI.Outline": {
       "m_EffectColor": {
        "r": 1.0,
        "g": 1.0,
        "b": 1.0,
        "a": 1.0
       },
       "m_EffectDistance": {
        "x": 5.0,
        "y": 5.0
       },
       "m_UseGraphicAlpha": true
      },
      "ItemScript": {
       "item_name_ui": {
        "prefab": "Transcendence"
       },
       "item_desc_ui": {
        "prefab": "Transcendence"
       },
       "item_icon_ui": {
        "prefab": "Transcendence"
       },
       "item_rarity_ui": {
        "prefab": "Transcendence"
       },
       "transcendence_panel": {
        "prefab": "Transcendence"
       }
      },
      "Core.BetterButton": {
       "m_Transition": 3,
       "m_Interactable": true,
       "m_TargetGraphic": {
        "prefab": "Transcendence"
       }
      }
     }
    },
    "Accept": {
     "transform": {
      "pos": {
       "x": 0.0,
       "y": 0.0,
       "z": 0.0
      },
      "scale": {
       "x": 1.0,
       "y": 1.0,
       "z": 1.0
      },
      "rotZ": -0.0
     },
     "scripts": {
      "UnityEngine.UI.Image": {
       "m_Color": {
        "r": 1.0,
        "g": 1.0,
        "b": 1.0,
        "a": 1.0
       },
       "m_RaycastTarget": true,
       "m_RaycastPadding": {
        "x": 0.0,
        "y": 0.0,
        "z": 0.0,
        "w": 0.0
       },
       "m_Maskable": true,
       "m_Type": 0,
       "m_PreserveAspect": false,
       "m_FillCenter": true,
       "m_FillMethod": 4,
       "m_FillAmount": 1.0,
       "m_FillClockwise": true,
       "m_FillOrigin": 0,
       "m_UseSpriteMesh": false,
       "m_PixelsPerUnitMultiplier": 1.0
      },
      "Core.BetterButton": {
       "m_Transition": 1,
       "m_Interactable": true,
       "m_TargetGraphic": {
        "prefab": "Transcendence"
       }
      },
      "UnityEngine.UI.Outline": {
       "m_EffectColor": {
        "r": 1.0,
        "g": 1.0,
        "b": 1.0,
        "a": 1.0
       },
       "m_EffectDistance": {
        "x": 3.0,
        "y": 3.0
       },
       "m_UseGraphicAlpha": true
      }
     }
    },
    "UpgradeName": {
     "transform": {
      "pos": {
       "x": 0.0,
       "y": 0.0,
       "z": 0.0
      },
      "scale": {
       "x": 1.0,
       "y": 1.0,
       "z": 1.0
      },
      "rotZ": -0.0
     },
     "scripts": {
      "UnityEngine.UI.Text": {
       "m_Color": {
        "r": 1.0,
        "g": 0.827258,
        "b": 0.0,
        "a": 1.0
       },
       "m_RaycastTarget": true,
       "m_RaycastPadding": {
        "x": 0.0,
        "y": 0.0,
        "z": 0.0,
        "w": 0.0
       },
       "m_Maskable": true
      }
     }
    },
    "Transcendence": {
     "transform": {
      "pos": {
       "x": 0.0,
       "y": 0.0,
       "z": 0.0
      },
      "scale": {
       "x": 1.0,
       "y": 1.0,
       "z": 1.0
      },
      "rotZ": -0.0
     },
     "scripts": {
      "UnityEngine.UI.Image": {
       "m_Color": {
        "r": 1.0,
        "g": 1.0,
        "b": 1.0,
        "a": 1.0
       },
       "m_RaycastTarget": true,
       "m_RaycastPadding": {
        "x": 0.0,
        "y": 0.0,
        "z": 0.0,
        "w": 0.0
       },
       "m_Maskable": true,
       "m_Type": 0,
       "m_PreserveAspect": false,
       "m_FillCenter": true,
       "m_FillMethod": 4,
       "m_FillAmount": 1.0,
       "m_FillClockwise": true,
       "m_FillOrigin": 0,
       "m_UseSpriteMesh": false,
       "m_PixelsPerUnitMultiplier": 1.0
      }
     }
    }
   }
  },
  "Fragmenter": {
   "transform": {
    "pos": {
     "x": -0.059723,
     "y": -2.044225,
     "z": -12.560895
    },
    "scale": {
     "x": 1.0,
     "y": 1.0,
     "z": 1.0
    },
    "rotZ": 0.0
   },
   "layer": 0,
   "scripts": {
    "FragmenterScript": {
     "projectile_generation": 0
    }
   }
  },
  "HealingOrb": {
   "transform": {
    "pos": {
     "x": 2.94,
     "y": 0.0,
     "z": 0.0
    },
    "scale": {
     "x": 0.2,
     "y": 0.2,
     "z": 0.2
    },
    "rotZ": 0.0
   },
   "layer": 0,
   "scripts": {
    "HealingOrb": {
     "healing_power": 10,
     "orb_charge_effect": {
      "prefab": "OrbCharge"
     }
    }
   },
   "body": {
    "type": "dynamic",
    "mass": 1.0,
    "gravityScale": 0.5,
    "drag": 0.0,
    "constraints": 0,
    "material": null
   },
   "colliders": [
    {
     "kind": "box",
     "trigger": false,
     "enabled": true,
     "offset": {
      "x": 0.0,
      "y": 0.0
     },
     "size": {
      "x": 1.0,
      "y": 1.0
     }
    }
   ],
   "children": {
    "Particle System": {
     "transform": {
      "pos": {
       "x": 0.0,
       "y": -0.27,
       "z": 0.0
      },
      "scale": {
       "x": 1.0,
       "y": 1.0,
       "z": 1.0
      },
      "rotZ": -0.0
     },
     "scripts": {
      "ParticleActivator": {}
     }
    }
   }
  },
  "DamageText": {
   "transform": {
    "pos": {
     "x": 0.0,
     "y": 0.0,
     "z": 0.0
    },
    "scale": {
     "x": 1.0,
     "y": 1.0,
     "z": 1.0
    },
    "rotZ": 0.0
   },
   "layer": 0,
   "scripts": {
    "TMPro.TextMeshPro": {
     "m_Color": {
      "r": 1.0,
      "g": 1.0,
      "b": 1.0,
      "a": 1.0
     },
     "m_RaycastTarget": true,
     "m_RaycastPadding": {
      "x": 0.0,
      "y": 0.0,
      "z": 0.0,
      "w": 0.0
     },
     "m_Maskable": true,
     "m_isRightToLeft": false,
     "m_fontColor32": {
      "r": 236,
      "g": 26,
      "b": 26,
      "a": 255
     },
     "m_fontColor": {
      "r": 0.924528,
      "g": 0.100303,
      "b": 0.100303,
      "a": 1.0
     },
     "m_enableVertexGradient": false,
     "m_colorMode": 3,
     "m_tintAllSprites": false,
     "m_TextStyleHashCode": -1183493901,
     "m_overrideHtmlColors": false,
     "m_faceColor": {
      "r": 255,
      "g": 255,
      "b": 255,
      "a": 255
     },
     "m_fontSize": 4.0,
     "m_fontSizeBase": 4.0,
     "m_fontWeight": 400,
     "m_enableAutoSizing": false,
     "m_fontSizeMin": 18.0,
     "m_fontSizeMax": 72.0,
     "m_fontStyle": 1,
     "m_HorizontalAlignment": 2,
     "m_VerticalAlignment": 512,
     "m_textAlignment": 65535,
     "m_characterSpacing": -13.32,
     "m_wordSpacing": 0.0,
     "m_lineSpacing": 0.0,
     "m_lineSpacingMax": 0.0,
     "m_paragraphSpacing": 0.0,
     "m_charWidthMaxAdj": 0.0,
     "m_enableWordWrapping": true,
     "m_wordWrappingRatios": 0.4,
     "m_overflowMode": 0,
     "m_enableKerning": true,
     "m_enableExtraPadding": false,
     "checkPaddingRequired": false,
     "m_isRichText": true,
     "m_parseCtrlCharacters": true,
     "m_isOrthographic": false,
     "m_isCullingEnabled": false,
     "m_horizontalMapping": 0,
     "m_verticalMapping": 0,
     "m_uvLineOffset": 0.0,
     "m_geometrySortingOrder": 0,
     "m_IsTextObjectScaleStatic": false,
     "m_VertexBufferAutoSizeReduction": false,
     "m_useMaxVisibleDescender": true,
     "m_pageToDisplay": 1,
     "m_margin": {
      "x": 0.0,
      "y": 0.0,
      "z": 0.0,
      "w": 0.0
     },
     "m_isUsingLegacyAnimationComponent": false,
     "m_isVolumetricText": false,
     "_SortingLayer": 0,
     "_SortingLayerID": 0,
     "_SortingOrder": 0,
     "m_hasFontAssetChanged": false,
     "m_maskType": 0
    }
   },
   "body": {
    "type": "dynamic",
    "mass": 1.0,
    "gravityScale": 0.65,
    "drag": 0.0,
    "constraints": 0,
    "material": null
   }
  },
  "Blood": {
   "transform": {
    "pos": {
     "x": 0.0,
     "y": 0.34,
     "z": 0.0
    },
    "scale": {
     "x": 1.0,
     "y": 1.0,
     "z": 1.0
    },
    "rotZ": -360.0
   },
   "layer": 0,
   "scripts": {
    "ParticleActivator": {}
   }
  },
  "SoulOrb": {
   "transform": {
    "pos": {
     "x": 2.94,
     "y": 0.0,
     "z": 0.0
    },
    "scale": {
     "x": 0.2,
     "y": 0.2,
     "z": 0.2
    },
    "rotZ": 0.0
   },
   "layer": 0,
   "scripts": {
    "SoulsOrb": {
     "soul_beam": {
      "prefab": "SoulRay"
     }
    }
   },
   "body": {
    "type": "dynamic",
    "mass": 1.0,
    "gravityScale": 0.5,
    "drag": 0.0,
    "constraints": 0,
    "material": null
   },
   "colliders": [
    {
     "kind": "box",
     "trigger": false,
     "enabled": true,
     "offset": {
      "x": 0.0,
      "y": 0.0
     },
     "size": {
      "x": 1.0,
      "y": 1.0
     }
    }
   ],
   "children": {
    "Particle System": {
     "transform": {
      "pos": {
       "x": 0.0,
       "y": -0.27,
       "z": 0.0
      },
      "scale": {
       "x": 1.0,
       "y": 1.0,
       "z": 1.0
      },
      "rotZ": -0.0
     },
     "scripts": {
      "ParticleActivator": {}
     }
    }
   }
  },
  "EnemyProj_1": {
   "transform": {
    "pos": {
     "x": 0.0,
     "y": 0.0,
     "z": 0.0
    },
    "scale": {
     "x": 0.12,
     "y": 0.12,
     "z": 0.12
    },
    "rotZ": 0.0
   },
   "layer": 0,
   "scripts": {
    "ProjectileEnemy": {
     "projectile_duration": 6,
     "projectile_explode": {
      "prefab": "ProjectileExplodeEnemy"
     },
     "proj_resistance": 1
    }
   },
   "colliders": [
    {
     "kind": "circle",
     "trigger": true,
     "enabled": true,
     "offset": {
      "x": 0.0,
      "y": 0.0
     },
     "radius": 0.5
    }
   ],
   "children": {
    "Trail": {
     "transform": {
      "pos": {
       "x": 0.0,
       "y": 0.0,
       "z": 0.0
      },
      "scale": {
       "x": 1.0,
       "y": 1.0,
       "z": 1.0
      },
      "rotZ": 0.0
     },
     "scripts": {
      "ParticleActivator": {}
     }
    }
   }
  },
  "EnemyProj_2": {
   "transform": {
    "pos": {
     "x": 0.0,
     "y": 0.0,
     "z": 0.0
    },
    "scale": {
     "x": 0.15,
     "y": 0.15,
     "z": 0.15
    },
    "rotZ": 0.0
   },
   "layer": 0,
   "scripts": {
    "ProjectileEnemy": {
     "projectile_duration": 5,
     "projectile_explode": {
      "prefab": "ProjectileExplodeEnemy"
     },
     "proj_resistance": 1
    }
   },
   "colliders": [
    {
     "kind": "circle",
     "trigger": true,
     "enabled": true,
     "offset": {
      "x": 0.0,
      "y": 0.0
     },
     "radius": 0.5
    }
   ],
   "children": {
    "Trail": {
     "transform": {
      "pos": {
       "x": 0.0,
       "y": 0.0,
       "z": 0.0
      },
      "scale": {
       "x": 1.0,
       "y": 1.0,
       "z": 1.0
      },
      "rotZ": 0.0
     },
     "scripts": {
      "ParticleActivator": {}
     }
    }
   }
  },
  "EnemyProj_4": {
   "transform": {
    "pos": {
     "x": 0.0,
     "y": 0.0,
     "z": 0.0
    },
    "scale": {
     "x": 0.22,
     "y": 0.22,
     "z": 0.22
    },
    "rotZ": 0.0
   },
   "layer": 0,
   "scripts": {
    "ProjectileEnemy": {
     "projectile_duration": 5,
     "projectile_explode": {
      "prefab": "ProjectileExplodeEnemy"
     },
     "proj_resistance": 3
    }
   },
   "colliders": [
    {
     "kind": "circle",
     "trigger": true,
     "enabled": true,
     "offset": {
      "x": 0.0,
      "y": 0.0
     },
     "radius": 0.5
    }
   ],
   "children": {
    "Trail": {
     "transform": {
      "pos": {
       "x": 0.0,
       "y": 0.0,
       "z": 0.0
      },
      "scale": {
       "x": 1.0,
       "y": 1.0,
       "z": 1.0
      },
      "rotZ": 0.0
     },
     "scripts": {
      "ParticleActivator": {}
     }
    }
   }
  },
  "EnemyProj_3": {
   "transform": {
    "pos": {
     "x": 0.0,
     "y": 0.0,
     "z": 0.0
    },
    "scale": {
     "x": 0.25,
     "y": 0.25,
     "z": 0.25
    },
    "rotZ": 0.0
   },
   "layer": 0,
   "scripts": {
    "ProjectileEnemy": {
     "projectile_duration": 20,
     "projectile_explode": {
      "prefab": "ProjectileExplodeEnemy"
     },
     "proj_resistance": 5
    }
   },
   "colliders": [
    {
     "kind": "circle",
     "trigger": true,
     "enabled": true,
     "offset": {
      "x": 0.0,
      "y": 0.0
     },
     "radius": 0.5
    }
   ],
   "children": {
    "Trail": {
     "transform": {
      "pos": {
       "x": 0.0,
       "y": 0.0,
       "z": 0.0
      },
      "scale": {
       "x": 1.0,
       "y": 1.0,
       "z": 1.0
      },
      "rotZ": 0.0
     },
     "scripts": {
      "ParticleActivator": {}
     }
    }
   }
  },
  "BossBomb": {
   "transform": {
    "pos": {
     "x": 2.94,
     "y": 0.0,
     "z": 0.0
    },
    "scale": {
     "x": 0.3,
     "y": 0.3,
     "z": 0.4
    },
    "rotZ": 0.0
   },
   "layer": 0,
   "scripts": {
    "Bomb": {
     "cooldown_explosion": 5.0,
     "explosion_effect": {
      "prefab": "BossBombEffect"
     }
    }
   },
   "body": {
    "type": "dynamic",
    "mass": 1.0,
    "gravityScale": 0.5,
    "drag": 0.0,
    "constraints": 0,
    "material": {
     "friction": 0.2,
     "bounciness": 0.5
    }
   },
   "colliders": [
    {
     "kind": "circle",
     "trigger": false,
     "enabled": false,
     "offset": {
      "x": 0.0,
      "y": 0.0
     },
     "radius": 0.5
    }
   ],
   "children": {
    "Particle System": {
     "transform": {
      "pos": {
       "x": -0.04,
       "y": 0.47,
       "z": 0.0
      },
      "scale": {
       "x": 0.49871,
       "y": 0.49871,
       "z": 0.49871
      },
      "rotZ": -0.0
     },
     "scripts": {
      "ParticleActivator": {}
     }
    },
    "Particle System (1)": {
     "transform": {
      "pos": {
       "x": -0.496,
       "y": -0.03,
       "z": 0.0
      },
      "scale": {
       "x": 0.49871,
       "y": 0.49871,
       "z": 0.49871
      },
      "rotZ": -0.0
     },
     "scripts": {
      "ParticleActivator": {}
     }
    },
    "Particle System (2)": {
     "transform": {
      "pos": {
       "x": 0.49,
       "y": -0.03,
       "z": 0.0
      },
      "scale": {
       "x": 0.49871,
       "y": 0.49871,
       "z": 0.49871
      },
      "rotZ": -0.0
     },
     "scripts": {
      "ParticleActivator": {}
     }
    }
   }
  },
  "OrbCharge": {
   "transform": {
    "pos": {
     "x": 0.0,
     "y": -0.513,
     "z": 0.0
    },
    "scale": {
     "x": 0.365625,
     "y": 1.0,
     "z": 1.45
    },
    "rotZ": -0.0
   },
   "layer": 0,
   "scripts": {
    "ParticleActivator": {}
   }
  },
  "SoulRay": {
   "transform": {
    "pos": {
     "x": 0.0,
     "y": -0.5533,
     "z": 0.0
    },
    "scale": {
     "x": 0.351814,
     "y": 31.830595,
     "z": 1.0
    },
    "rotZ": 0.0
   },
   "layer": 0,
   "scripts": {
    "SoulRay": {}
   },
   "colliders": [
    {
     "kind": "box",
     "trigger": true,
     "enabled": true,
     "offset": {
      "x": 0.0,
      "y": -0.001955
     },
     "size": {
      "x": 1.0,
      "y": 0.710593
     }
    }
   ],
   "body": {
    "type": "dynamic",
    "mass": 0.2,
    "gravityScale": 0.0,
    "drag": 0.0,
    "constraints": 0,
    "material": null
   },
   "children": {
    "Particle System": {
     "transform": {
      "pos": {
       "x": 0.0,
       "y": 0.0,
       "z": 0.0
      },
      "scale": {
       "x": 1.0,
       "y": 1.0,
       "z": 1.0
      },
      "rotZ": 0.0
     },
     "scripts": {
      "ParticleActivator": {}
     }
    }
   }
  },
  "ProjectileExplodeEnemy": {
   "transform": {
    "pos": {
     "x": 0.0,
     "y": 0.0,
     "z": 0.0
    },
    "scale": {
     "x": 1.0,
     "y": 1.0,
     "z": 1.0
    },
    "rotZ": -0.0
   },
   "layer": 0,
   "scripts": {
    "ParticleActivator": {}
   }
  },
  "BossBombEffect": {
   "transform": {
    "pos": {
     "x": 0.0,
     "y": 0.0,
     "z": 0.0
    },
    "scale": {
     "x": 1.2,
     "y": 1.2,
     "z": 1.2
    },
    "rotZ": -0.0
   },
   "layer": 0,
   "scripts": {
    "ParticleActivator": {}
   }
  }
 },
 "itemGroups": {
  "cards": [
   0,
   1,
   2,
   3,
   4,
   5,
   6,
   7,
   8,
   9,
   20,
   21,
   22,
   23,
   24,
   25,
   26,
   27,
   28,
   29,
   30,
   31,
   32,
   33,
   34,
   35,
   36,
   40,
   41,
   42,
   43,
   44,
   45,
   46,
   47,
   48,
   49,
   50,
   51,
   52,
   60,
   61,
   62,
   63,
   64,
   65,
   66,
   67,
   68,
   69,
   70,
   71,
   72,
   73,
   74,
   75,
   76,
   77,
   78,
   79,
   80,
   81,
   82,
   83,
   84,
   85,
   86,
   87,
   88,
   89,
   90
  ],
  "staffs": [
   300,
   301,
   302,
   303,
   304,
   305,
   306
  ],
  "hats": [
   200,
   201,
   202,
   203,
   204,
   205
  ]
 },
 "items": {
  "cards": [
   {
    "id": 0,
    "name": "Swift",
    "price": 0,
    "rarity": 0,
    "attackSpeed": 0.0,
    "jumpNumber": 0,
    "armor": 0.0,
    "speed": 0.0,
    "projectile": null,
    "equivalence": {
     "display": true,
     "has": false,
     "quantity": 0,
     "item": null
    },
    "asset": "0.Swift"
   },
   {
    "id": 1,
    "name": "Catalyst",
    "price": 0,
    "rarity": 0,
    "attackSpeed": 0.0,
    "jumpNumber": 0,
    "armor": 0.0,
    "speed": 0.0,
    "projectile": null,
    "equivalence": {
     "display": true,
     "has": false,
     "quantity": 0,
     "item": null
    },
    "asset": "1.Catalyst"
   },
   {
    "id": 2,
    "name": "Impulse",
    "price": 0,
    "rarity": 0,
    "attackSpeed": 0.0,
    "jumpNumber": 0,
    "armor": 0.0,
    "speed": 0.0,
    "projectile": null,
    "equivalence": {
     "display": true,
     "has": false,
     "quantity": 0,
     "item": null
    },
    "asset": "2.Impulse"
   },
   {
    "id": 3,
    "name": "Resonance",
    "price": 0,
    "rarity": 0,
    "attackSpeed": 0.0,
    "jumpNumber": 0,
    "armor": 0.0,
    "speed": 0.0,
    "projectile": null,
    "equivalence": {
     "display": true,
     "has": false,
     "quantity": 0,
     "item": null
    },
    "asset": "3.Resonance"
   },
   {
    "id": 4,
    "name": "Growth",
    "price": 0,
    "rarity": 0,
    "attackSpeed": 0.0,
    "jumpNumber": 0,
    "armor": 0.0,
    "speed": 0.0,
    "projectile": null,
    "equivalence": {
     "display": true,
     "has": false,
     "quantity": 0,
     "item": null
    },
    "asset": "4.Growth"
   },
   {
    "id": 5,
    "name": "Renew",
    "price": 0,
    "rarity": 0,
    "attackSpeed": 0.0,
    "jumpNumber": 0,
    "armor": 0.0,
    "speed": 0.0,
    "projectile": null,
    "equivalence": {
     "display": false,
     "has": false,
     "quantity": 0,
     "item": null
    },
    "asset": "5.Renew"
   },
   {
    "id": 6,
    "name": "Souls",
    "price": 0,
    "rarity": 0,
    "attackSpeed": 0.0,
    "jumpNumber": 0,
    "armor": 0.0,
    "speed": 0.0,
    "projectile": null,
    "equivalence": {
     "display": true,
     "has": false,
     "quantity": 0,
     "item": null
    },
    "asset": "6.Souls"
   },
   {
    "id": 7,
    "name": "Resist",
    "price": 0,
    "rarity": 0,
    "attackSpeed": 0.0,
    "jumpNumber": 0,
    "armor": 0.0,
    "speed": 0.0,
    "projectile": null,
    "equivalence": {
     "display": true,
     "has": false,
     "quantity": 0,
     "item": null
    },
    "asset": "7.Resist"
   },
   {
    "id": 8,
    "name": "Eyesight",
    "price": 0,
    "rarity": 0,
    "attackSpeed": 0.0,
    "jumpNumber": 0,
    "armor": 0.0,
    "speed": 0.0,
    "projectile": null,
    "equivalence": {
     "display": true,
     "has": false,
     "quantity": 0,
     "item": null
    },
    "asset": "8.Eyesight"
   },
   {
    "id": 9,
    "name": "Stability",
    "price": 0,
    "rarity": 0,
    "attackSpeed": 0.0,
    "jumpNumber": 0,
    "armor": 0.0,
    "speed": 0.0,
    "projectile": null,
    "equivalence": {
     "display": true,
     "has": false,
     "quantity": 0,
     "item": null
    },
    "asset": "9.Stability"
   },
   {
    "id": 20,
    "name": "Cloak",
    "price": 0,
    "rarity": 1,
    "attackSpeed": 0.0,
    "jumpNumber": 0,
    "armor": 0.0,
    "speed": 0.0,
    "projectile": null,
    "equivalence": {
     "display": true,
     "has": false,
     "quantity": 0,
     "item": null
    },
    "asset": "20.Cloak"
   },
   {
    "id": 21,
    "name": "Gush",
    "price": 0,
    "rarity": 1,
    "attackSpeed": 0.0,
    "jumpNumber": 0,
    "armor": 0.0,
    "speed": 0.0,
    "projectile": null,
    "equivalence": {
     "display": true,
     "has": false,
     "quantity": 0,
     "item": null
    },
    "asset": "21.Gush"
   },
   {
    "id": 22,
    "name": "Swift+",
    "price": 0,
    "rarity": 1,
    "attackSpeed": 0.0,
    "jumpNumber": 0,
    "armor": 0.0,
    "speed": 0.0,
    "projectile": null,
    "equivalence": {
     "display": true,
     "has": true,
     "quantity": 2,
     "item": 0
    },
    "asset": "22.Swift+"
   },
   {
    "id": 23,
    "name": "Resonance+",
    "price": 0,
    "rarity": 1,
    "attackSpeed": 0.0,
    "jumpNumber": 0,
    "armor": 0.0,
    "speed": 0.0,
    "projectile": null,
    "equivalence": {
     "display": true,
     "has": true,
     "quantity": 2,
     "item": 3
    },
    "asset": "23.Resonance+"
   },
   {
    "id": 24,
    "name": "Growth+",
    "price": 0,
    "rarity": 1,
    "attackSpeed": 0.0,
    "jumpNumber": 0,
    "armor": 0.0,
    "speed": 0.0,
    "projectile": null,
    "equivalence": {
     "display": true,
     "has": true,
     "quantity": 2,
     "item": 4
    },
    "asset": "24.Growth+"
   },
   {
    "id": 25,
    "name": "Charge",
    "price": 0,
    "rarity": 1,
    "attackSpeed": 0.0,
    "jumpNumber": 0,
    "armor": 0.0,
    "speed": 0.0,
    "projectile": null,
    "equivalence": {
     "display": true,
     "has": false,
     "quantity": 0,
     "item": null
    },
    "asset": "25.Charge"
   },
   {
    "id": 26,
    "name": "Regrowth",
    "price": 0,
    "rarity": 1,
    "attackSpeed": 0.0,
    "jumpNumber": 0,
    "armor": 0.0,
    "speed": 0.0,
    "projectile": null,
    "equivalence": {
     "display": true,
     "has": false,
     "quantity": 0,
     "item": null
    },
    "asset": "26.Regrowth"
   },
   {
    "id": 27,
    "name": "Leech",
    "price": 0,
    "rarity": 1,
    "attackSpeed": 0.0,
    "jumpNumber": 0,
    "armor": 0.0,
    "speed": 0.0,
    "projectile": null,
    "equivalence": {
     "display": true,
     "has": false,
     "quantity": 0,
     "item": null
    },
    "asset": "27.Leech"
   },
   {
    "id": 28,
    "name": "Fragmentation",
    "price": 0,
    "rarity": 1,
    "attackSpeed": 0.0,
    "jumpNumber": 0,
    "armor": 0.0,
    "speed": 0.0,
    "projectile": null,
    "equivalence": {
     "display": true,
     "has": false,
     "quantity": 0,
     "item": null
    },
    "asset": "28.Fragmentation"
   },
   {
    "id": 29,
    "name": "Catalyst+",
    "price": 0,
    "rarity": 1,
    "attackSpeed": 0.0,
    "jumpNumber": 0,
    "armor": 0.0,
    "speed": 0.0,
    "projectile": null,
    "equivalence": {
     "display": true,
     "has": true,
     "quantity": 2,
     "item": 1
    },
    "asset": "29.Catalyst+"
   },
   {
    "id": 30,
    "name": "Luck",
    "price": 0,
    "rarity": 1,
    "attackSpeed": 0.0,
    "jumpNumber": 0,
    "armor": 0.0,
    "speed": 0.0,
    "projectile": null,
    "equivalence": {
     "display": true,
     "has": false,
     "quantity": 0,
     "item": null
    },
    "asset": "30.Luck"
   },
   {
    "id": 31,
    "name": "Thunderbolt",
    "price": 0,
    "rarity": 1,
    "attackSpeed": 0.0,
    "jumpNumber": 0,
    "armor": 0.0,
    "speed": 0.0,
    "projectile": null,
    "equivalence": {
     "display": true,
     "has": false,
     "quantity": 0,
     "item": null
    },
    "asset": "31.Thunderbolt"
   },
   {
    "id": 32,
    "name": "Orb",
    "price": 0,
    "rarity": 1,
    "attackSpeed": 0.0,
    "jumpNumber": 0,
    "armor": 0.0,
    "speed": 0.0,
    "projectile": null,
    "equivalence": {
     "display": true,
     "has": false,
     "quantity": 0,
     "item": null
    },
    "asset": "32.Orb"
   },
   {
    "id": 33,
    "name": "Precision",
    "price": 0,
    "rarity": 1,
    "attackSpeed": 0.0,
    "jumpNumber": 0,
    "armor": 0.0,
    "speed": 0.0,
    "projectile": null,
    "equivalence": {
     "display": true,
     "has": false,
     "quantity": 0,
     "item": null
    },
    "asset": "33.Precision"
   },
   {
    "id": 34,
    "name": "Shrink",
    "price": 0,
    "rarity": 1,
    "attackSpeed": 0.0,
    "jumpNumber": 0,
    "armor": 0.0,
    "speed": 0.0,
    "projectile": null,
    "equivalence": {
     "display": true,
     "has": false,
     "quantity": 0,
     "item": null
    },
    "asset": "34.Shrink"
   },
   {
    "id": 35,
    "name": "Friction",
    "price": 0,
    "rarity": 1,
    "attackSpeed": 0.0,
    "jumpNumber": 0,
    "armor": 0.0,
    "speed": 0.0,
    "projectile": null,
    "equivalence": {
     "display": true,
     "has": false,
     "quantity": 0,
     "item": null
    },
    "asset": "35.Friction"
   },
   {
    "id": 36,
    "name": "Rage",
    "price": 0,
    "rarity": 1,
    "attackSpeed": 0.0,
    "jumpNumber": 0,
    "armor": 0.0,
    "speed": 0.0,
    "projectile": null,
    "equivalence": {
     "display": true,
     "has": false,
     "quantity": 0,
     "item": null
    },
    "asset": "36.Rage"
   },
   {
    "id": 40,
    "name": "Growth++",
    "price": 0,
    "rarity": 2,
    "attackSpeed": 0.0,
    "jumpNumber": 0,
    "armor": 0.0,
    "speed": 0.0,
    "projectile": null,
    "equivalence": {
     "display": true,
     "has": true,
     "quantity": 4,
     "item": 4
    },
    "asset": "40.Growth++"
   },
   {
    "id": 41,
    "name": "Will-O-Wisp",
    "price": 0,
    "rarity": 2,
    "attackSpeed": 0.0,
    "jumpNumber": 0,
    "armor": 0.0,
    "speed": 0.0,
    "projectile": null,
    "equivalence": {
     "display": true,
     "has": false,
     "quantity": 0,
     "item": null
    },
    "asset": "41.Will-O-Wisp"
   },
   {
    "id": 42,
    "name": "Friction+",
    "price": 0,
    "rarity": 2,
    "attackSpeed": 0.0,
    "jumpNumber": 0,
    "armor": 0.0,
    "speed": 0.0,
    "projectile": null,
    "equivalence": {
     "display": true,
     "has": true,
     "quantity": 3,
     "item": 35
    },
    "asset": "42.Friction+"
   },
   {
    "id": 43,
    "name": "Cold",
    "price": 0,
    "rarity": 2,
    "attackSpeed": 0.0,
    "jumpNumber": 0,
    "armor": 0.0,
    "speed": 0.0,
    "projectile": null,
    "equivalence": {
     "display": true,
     "has": false,
     "quantity": 0,
     "item": null
    },
    "asset": "43.Cold"
   },
   {
    "id": 44,
    "name": "Fragmentation+",
    "price": 0,
    "rarity": 2,
    "attackSpeed": 0.0,
    "jumpNumber": 0,
    "armor": 0.0,
    "speed": 0.0,
    "projectile": null,
    "equivalence": {
     "display": true,
     "has": true,
     "quantity": 3,
     "item": 28
    },
    "asset": "44.Fragmentation+"
   },
   {
    "id": 45,
    "name": "Overheat",
    "price": 0,
    "rarity": 2,
    "attackSpeed": 0.0,
    "jumpNumber": 0,
    "armor": 0.0,
    "speed": 0.0,
    "projectile": null,
    "equivalence": {
     "display": true,
     "has": false,
     "quantity": 0,
     "item": null
    },
    "asset": "45.Overheat"
   },
   {
    "id": 46,
    "name": "Leech+",
    "price": 0,
    "rarity": 2,
    "attackSpeed": 0.0,
    "jumpNumber": 0,
    "armor": 0.0,
    "speed": 0.0,
    "projectile": null,
    "equivalence": {
     "display": true,
     "has": true,
     "quantity": 3,
     "item": 27
    },
    "asset": "46.Leech+"
   },
   {
    "id": 47,
    "name": "Thunderbolt+",
    "price": 0,
    "rarity": 2,
    "attackSpeed": 0.0,
    "jumpNumber": 0,
    "armor": 0.0,
    "speed": 0.0,
    "projectile": null,
    "equivalence": {
     "display": true,
     "has": true,
     "quantity": 3,
     "item": 31
    },
    "asset": "47.Thunderbolt+"
   },
   {
    "id": 48,
    "name": "Appraisal",
    "price": 0,
    "rarity": 2,
    "attackSpeed": 0.0,
    "jumpNumber": 0,
    "armor": 0.0,
    "speed": 0.0,
    "projectile": null,
    "equivalence": {
     "display": true,
     "has": false,
     "quantity": 0,
     "item": null
    },
    "asset": "48.Appraisal"
   },
   {
    "id": 49,
    "name": "Barrier",
    "price": 0,
    "rarity": 2,
    "attackSpeed": 0.0,
    "jumpNumber": 0,
    "armor": 0.0,
    "speed": 0.0,
    "projectile": null,
    "equivalence": {
     "display": true,
     "has": false,
     "quantity": 0,
     "item": null
    },
    "asset": "49.Barrier"
   },
   {
    "id": 50,
    "name": "Focus",
    "price": 0,
    "rarity": 2,
    "attackSpeed": 0.0,
    "jumpNumber": 0,
    "armor": 0.0,
    "speed": 0.0,
    "projectile": null,
    "equivalence": {
     "display": true,
     "has": false,
     "quantity": 0,
     "item": null
    },
    "asset": "50.Focus"
   },
   {
    "id": 51,
    "name": "Tome",
    "price": 0,
    "rarity": 2,
    "attackSpeed": 0.0,
    "jumpNumber": 0,
    "armor": 0.0,
    "speed": 0.0,
    "projectile": null,
    "equivalence": {
     "display": true,
     "has": false,
     "quantity": 0,
     "item": null
    },
    "asset": "51.Tome"
   },
   {
    "id": 52,
    "name": "Wound",
    "price": 0,
    "rarity": 2,
    "attackSpeed": 0.0,
    "jumpNumber": 0,
    "armor": 0.0,
    "speed": 0.0,
    "projectile": null,
    "equivalence": {
     "display": true,
     "has": false,
     "quantity": 0,
     "item": null
    },
    "asset": "52. Wound"
   },
   {
    "id": 60,
    "name": "God of Thunder",
    "price": 0,
    "rarity": 3,
    "attackSpeed": 0.0,
    "jumpNumber": 0,
    "armor": 0.0,
    "speed": 0.0,
    "projectile": null,
    "equivalence": {
     "display": true,
     "has": false,
     "quantity": 0,
     "item": null
    },
    "asset": "60.ThunderGod"
   },
   {
    "id": 61,
    "name": "Vampire",
    "price": 0,
    "rarity": 3,
    "attackSpeed": 0.0,
    "jumpNumber": 0,
    "armor": 0.0,
    "speed": 0.0,
    "projectile": null,
    "equivalence": {
     "display": true,
     "has": false,
     "quantity": 0,
     "item": null
    },
    "asset": "61.Vampire"
   },
   {
    "id": 62,
    "name": "RAM Destroyer",
    "price": 0,
    "rarity": 3,
    "attackSpeed": 0.0,
    "jumpNumber": 0,
    "armor": 0.0,
    "speed": 0.0,
    "projectile": null,
    "equivalence": {
     "display": true,
     "has": false,
     "quantity": 0,
     "item": null
    },
    "asset": "62.Ram Destroyer"
   },
   {
    "id": 63,
    "name": "Bloody Mage",
    "price": 0,
    "rarity": 3,
    "attackSpeed": 0.0,
    "jumpNumber": 0,
    "armor": 0.0,
    "speed": 0.0,
    "projectile": null,
    "equivalence": {
     "display": true,
     "has": false,
     "quantity": 0,
     "item": null
    },
    "asset": "63.Blood Mage"
   },
   {
    "id": 64,
    "name": "Anti-Aircraft",
    "price": 0,
    "rarity": 3,
    "attackSpeed": 0.0,
    "jumpNumber": 0,
    "armor": 0.0,
    "speed": 0.0,
    "projectile": null,
    "equivalence": {
     "display": true,
     "has": false,
     "quantity": 0,
     "item": null
    },
    "asset": "64.AntiAircraft"
   },
   {
    "id": 65,
    "name": "Flying Sorcerer",
    "price": 0,
    "rarity": 3,
    "attackSpeed": 0.0,
    "jumpNumber": 0,
    "armor": 0.0,
    "speed": 0.0,
    "projectile": null,
    "equivalence": {
     "display": true,
     "has": false,
     "quantity": 0,
     "item": null
    },
    "asset": "65.FlyingSorcerer"
   },
   {
    "id": 66,
    "name": "Colossus",
    "price": 0,
    "rarity": 3,
    "attackSpeed": 0.0,
    "jumpNumber": 0,
    "armor": 0.0,
    "speed": 0.0,
    "projectile": null,
    "equivalence": {
     "display": true,
     "has": false,
     "quantity": 0,
     "item": null
    },
    "asset": "66.Colossus"
   },
   {
    "id": 67,
    "name": "Gnome",
    "price": 0,
    "rarity": 3,
    "attackSpeed": 0.0,
    "jumpNumber": 0,
    "armor": 0.0,
    "speed": 0.0,
    "projectile": null,
    "equivalence": {
     "display": true,
     "has": false,
     "quantity": 0,
     "item": null
    },
    "asset": "67.Gnome"
   },
   {
    "id": 68,
    "name": "Hoarder",
    "price": 0,
    "rarity": 3,
    "attackSpeed": 0.0,
    "jumpNumber": 0,
    "armor": 0.0,
    "speed": 0.0,
    "projectile": null,
    "equivalence": {
     "display": true,
     "has": false,
     "quantity": 0,
     "item": null
    },
    "asset": "68.Hoarder"
   },
   {
    "id": 69,
    "name": "Protector",
    "price": 0,
    "rarity": 3,
    "attackSpeed": 0.0,
    "jumpNumber": 0,
    "armor": 0.0,
    "speed": 0.0,
    "projectile": null,
    "equivalence": {
     "display": true,
     "has": false,
     "quantity": 0,
     "item": null
    },
    "asset": "69.Protector"
   },
   {
    "id": 70,
    "name": "Sadistic",
    "price": 0,
    "rarity": 3,
    "attackSpeed": 0.0,
    "jumpNumber": 0,
    "armor": 0.0,
    "speed": 0.0,
    "projectile": null,
    "equivalence": {
     "display": true,
     "has": false,
     "quantity": 0,
     "item": null
    },
    "asset": "70.Sadistic"
   },
   {
    "id": 71,
    "name": "Marksman",
    "price": 0,
    "rarity": 3,
    "attackSpeed": 0.0,
    "jumpNumber": 0,
    "armor": 0.0,
    "speed": 0.0,
    "projectile": null,
    "equivalence": {
     "display": true,
     "has": false,
     "quantity": 0,
     "item": null
    },
    "asset": "71.Marksman"
   },
   {
    "id": 72,
    "name": "Dealer",
    "price": 0,
    "rarity": 3,
    "attackSpeed": 0.0,
    "jumpNumber": 0,
    "armor": 0.0,
    "speed": 0.0,
    "projectile": null,
    "equivalence": {
     "display": true,
     "has": false,
     "quantity": 0,
     "item": null
    },
    "asset": "72.Dealer"
   },
   {
    "id": 73,
    "name": "Blessed",
    "price": 0,
    "rarity": 3,
    "attackSpeed": 0.0,
    "jumpNumber": 0,
    "armor": 0.0,
    "speed": 0.0,
    "projectile": null,
    "equivalence": {
     "display": true,
     "has": false,
     "quantity": 0,
     "item": null
    },
    "asset": "73.Blessed"
   },
   {
    "id": 74,
    "name": "White Dwarf",
    "price": 0,
    "rarity": 3,
    "attackSpeed": 0.0,
    "jumpNumber": 0,
    "armor": 0.0,
    "speed": 0.0,
    "projectile": null,
    "equivalence": {
     "display": true,
     "has": false,
     "quantity": 0,
     "item": null
    },
    "asset": "74.WhiteDwarf"
   },
   {
    "id": 75,
    "name": "Burning Man",
    "price": 0,
    "rarity": 3,
    "attackSpeed": 0.0,
    "jumpNumber": 0,
    "armor": 0.0,
    "speed": 0.0,
    "projectile": null,
    "equivalence": {
     "display": true,
     "has": false,
     "quantity": 0,
     "item": null
    },
    "asset": "75.Burning Man"
   },
   {
    "id": 76,
    "name": "Exorcist",
    "price": 0,
    "rarity": 3,
    "attackSpeed": 0.0,
    "jumpNumber": 0,
    "armor": 0.0,
    "speed": 0.0,
    "projectile": null,
    "equivalence": {
     "display": true,
     "has": false,
     "quantity": 0,
     "item": null
    },
    "asset": "76.Exorcist"
   },
   {
    "id": 77,
    "name": "Comet",
    "price": 0,
    "rarity": 3,
    "attackSpeed": 0.0,
    "jumpNumber": 0,
    "armor": 0.0,
    "speed": 0.0,
    "projectile": null,
    "equivalence": {
     "display": true,
     "has": false,
     "quantity": 0,
     "item": null
    },
    "asset": "77. Comet"
   },
   {
    "id": 78,
    "name": "Streamer",
    "price": 0,
    "rarity": 3,
    "attackSpeed": 0.0,
    "jumpNumber": 0,
    "armor": 0.0,
    "speed": 0.0,
    "projectile": null,
    "equivalence": {
     "display": true,
     "has": false,
     "quantity": 0,
     "item": null
    },
    "asset": "78. Streamer"
   },
   {
    "id": 79,
    "name": "Pac-Man",
    "price": 0,
    "rarity": 3,
    "attackSpeed": 0.0,
    "jumpNumber": 0,
    "armor": 0.0,
    "speed": 0.0,
    "projectile": null,
    "equivalence": {
     "display": true,
     "has": false,
     "quantity": 0,
     "item": null
    },
    "asset": "79. Pacman"
   },
   {
    "id": 80,
    "name": "Absorbent",
    "price": 0,
    "rarity": 3,
    "attackSpeed": 0.0,
    "jumpNumber": 0,
    "armor": 0.0,
    "speed": 0.0,
    "projectile": null,
    "equivalence": {
     "display": true,
     "has": false,
     "quantity": 0,
     "item": null
    },
    "asset": "80. Absorbent"
   },
   {
    "id": 81,
    "name": "Plague Spreader",
    "price": 0,
    "rarity": 3,
    "attackSpeed": 0.0,
    "jumpNumber": 0,
    "armor": 0.0,
    "speed": 0.0,
    "projectile": null,
    "equivalence": {
     "display": true,
     "has": false,
     "quantity": 0,
     "item": null
    },
    "asset": "81. Plague Spreader"
   },
   {
    "id": 82,
    "name": "Speculator",
    "price": 0,
    "rarity": 3,
    "attackSpeed": 0.0,
    "jumpNumber": 0,
    "armor": 0.0,
    "speed": 0.0,
    "projectile": null,
    "equivalence": {
     "display": true,
     "has": false,
     "quantity": 0,
     "item": null
    },
    "asset": "82. Speculator"
   },
   {
    "id": 83,
    "name": "Bunker",
    "price": 0,
    "rarity": 3,
    "attackSpeed": 0.0,
    "jumpNumber": 0,
    "armor": 0.0,
    "speed": 0.0,
    "projectile": null,
    "equivalence": {
     "display": true,
     "has": false,
     "quantity": 0,
     "item": null
    },
    "asset": "83. Bunker"
   },
   {
    "id": 84,
    "name": "Desperate",
    "price": 0,
    "rarity": 3,
    "attackSpeed": 0.0,
    "jumpNumber": 0,
    "armor": 0.0,
    "speed": 0.0,
    "projectile": null,
    "equivalence": {
     "display": true,
     "has": false,
     "quantity": 0,
     "item": null
    },
    "asset": "84. Desperate"
   },
   {
    "id": 85,
    "name": "Enchanter",
    "price": 0,
    "rarity": 3,
    "attackSpeed": 0.0,
    "jumpNumber": 0,
    "armor": 0.0,
    "speed": 0.0,
    "projectile": null,
    "equivalence": {
     "display": true,
     "has": false,
     "quantity": 0,
     "item": null
    },
    "asset": "85. Enchanter"
   },
   {
    "id": 86,
    "name": "Avenger",
    "price": 0,
    "rarity": 3,
    "attackSpeed": 0.0,
    "jumpNumber": 0,
    "armor": 0.0,
    "speed": 0.0,
    "projectile": null,
    "equivalence": {
     "display": true,
     "has": false,
     "quantity": 0,
     "item": null
    },
    "asset": "86. Avenger"
   },
   {
    "id": 87,
    "name": "Nerd",
    "price": 0,
    "rarity": 3,
    "attackSpeed": 0.0,
    "jumpNumber": 0,
    "armor": 0.0,
    "speed": 0.0,
    "projectile": null,
    "equivalence": {
     "display": true,
     "has": false,
     "quantity": 0,
     "item": null
    },
    "asset": "87. Nerd"
   },
   {
    "id": 88,
    "name": "Tryhard",
    "price": 0,
    "rarity": 3,
    "attackSpeed": 0.0,
    "jumpNumber": 0,
    "armor": 0.0,
    "speed": 0.0,
    "projectile": null,
    "equivalence": {
     "display": true,
     "has": false,
     "quantity": 0,
     "item": null
    },
    "asset": "88. Try Hard"
   },
   {
    "id": 89,
    "name": "Bulldozer",
    "price": 0,
    "rarity": 3,
    "attackSpeed": 0.0,
    "jumpNumber": 0,
    "armor": 0.0,
    "speed": 0.0,
    "projectile": null,
    "equivalence": {
     "display": true,
     "has": false,
     "quantity": 0,
     "item": null
    },
    "asset": "89. Bulldozer"
   },
   {
    "id": 90,
    "name": "",
    "price": 0,
    "rarity": 3,
    "attackSpeed": 1.0,
    "jumpNumber": 0,
    "armor": 0.0,
    "speed": 0.0,
    "projectile": null,
    "equivalence": {
     "display": true,
     "has": false,
     "quantity": 0,
     "item": null
    },
    "asset": "90. Freezer"
   }
  ],
  "staffs": [
   {
    "id": 300,
    "name": "Wizard's Staff",
    "price": 0,
    "rarity": 0,
    "attackSpeed": 0.9,
    "jumpNumber": 0,
    "armor": 0.0,
    "speed": 0.0,
    "projectile": "Projectile",
    "equivalence": {
     "display": false,
     "has": false,
     "quantity": 0,
     "item": null
    },
    "asset": "0. Wizard's Staff"
   },
   {
    "id": 301,
    "name": "Emerald Staff",
    "price": 25,
    "rarity": 0,
    "attackSpeed": 0.63,
    "jumpNumber": 0,
    "armor": 0.0,
    "speed": 0.0,
    "projectile": "Projectile_Homing",
    "equivalence": {
     "display": false,
     "has": false,
     "quantity": 0,
     "item": null
    },
    "asset": "1. Emerald Staff"
   },
   {
    "id": 302,
    "name": "Trident",
    "price": 25,
    "rarity": 0,
    "attackSpeed": 1.38,
    "jumpNumber": 0,
    "armor": 0.0,
    "speed": 0.0,
    "projectile": "Projectile_Triple",
    "equivalence": {
     "display": false,
     "has": false,
     "quantity": 0,
     "item": null
    },
    "asset": "2. Trident"
   },
   {
    "id": 303,
    "name": "Boomstaff",
    "price": 25,
    "rarity": 0,
    "attackSpeed": 1.7,
    "jumpNumber": 0,
    "armor": 0.0,
    "speed": 0.0,
    "projectile": "ExplosiveProjectile",
    "equivalence": {
     "display": false,
     "has": false,
     "quantity": 0,
     "item": null
    },
    "asset": "3. Boomstaff"
   },
   {
    "id": 304,
    "name": "Thunder Staff",
    "price": 25,
    "rarity": 0,
    "attackSpeed": 2.9,
    "jumpNumber": 0,
    "armor": 0.0,
    "speed": 0.0,
    "projectile": "Projectile",
    "equivalence": {
     "display": false,
     "has": false,
     "quantity": 0,
     "item": null
    },
    "asset": "4. Thunder Staff"
   },
   {
    "id": 305,
    "name": "Frozen Tip",
    "price": 25,
    "rarity": 0,
    "attackSpeed": 0.55,
    "jumpNumber": 0,
    "armor": 0.0,
    "speed": 0.0,
    "projectile": "Projectile_Piercing",
    "equivalence": {
     "display": false,
     "has": false,
     "quantity": 0,
     "item": null
    },
    "asset": "5. Frozen Tip"
   },
   {
    "id": 306,
    "name": "Rainbow Staff",
    "price": 25,
    "rarity": 0,
    "attackSpeed": 1.0,
    "jumpNumber": 0,
    "armor": 0.0,
    "speed": 0.0,
    "projectile": "Projectile",
    "equivalence": {
     "display": false,
     "has": false,
     "quantity": 0,
     "item": null
    },
    "asset": "6. Rainbow Staff"
   }
  ],
  "hats": [
   {
    "id": 200,
    "name": "Wizard's Hat",
    "price": 0,
    "rarity": 0,
    "attackSpeed": 0.9,
    "jumpNumber": 0,
    "armor": 0.0,
    "speed": 1.0,
    "projectile": "Projectile",
    "equivalence": {
     "display": false,
     "has": false,
     "quantity": 0,
     "item": null
    },
    "asset": "0. Wizard's Hat"
   },
   {
    "id": 201,
    "name": "Helmet",
    "price": 25,
    "rarity": 0,
    "attackSpeed": 0.9,
    "jumpNumber": 0,
    "armor": 6.0,
    "speed": 0.5,
    "projectile": "Projectile",
    "equivalence": {
     "display": false,
     "has": false,
     "quantity": 0,
     "item": null
    },
    "asset": "1. Helmet"
   },
   {
    "id": 202,
    "name": "Propeller Beanie",
    "price": 25,
    "rarity": 0,
    "attackSpeed": 0.9,
    "jumpNumber": 1,
    "armor": 0.0,
    "speed": 1.0,
    "projectile": "Projectile",
    "equivalence": {
     "display": false,
     "has": false,
     "quantity": 0,
     "item": null
    },
    "asset": "2. Propeller Beanie"
   },
   {
    "id": 203,
    "name": "Uncommon Hat",
    "price": 25,
    "rarity": 0,
    "attackSpeed": 0.9,
    "jumpNumber": 0,
    "armor": 0.0,
    "speed": 1.0,
    "projectile": "Projectile",
    "equivalence": {
     "display": false,
     "has": false,
     "quantity": 0,
     "item": null
    },
    "asset": "3. Uncommon Hat"
   },
   {
    "id": 204,
    "name": "Challenger's Hat",
    "price": 25,
    "rarity": 0,
    "attackSpeed": 0.9,
    "jumpNumber": 0,
    "armor": 0.0,
    "speed": 1.0,
    "projectile": "Projectile",
    "equivalence": {
     "display": false,
     "has": false,
     "quantity": 0,
     "item": null
    },
    "asset": "4. Challenger's Hat"
   },
   {
    "id": 205,
    "name": "Fedora",
    "price": 25,
    "rarity": 0,
    "attackSpeed": 0.9,
    "jumpNumber": 0,
    "armor": 0.0,
    "speed": 1.0,
    "projectile": "Projectile",
    "equivalence": {
     "display": false,
     "has": false,
     "quantity": 0,
     "item": null
    },
    "asset": "5. Fedora"
   }
  ]
 },
 "managers": {
  "WaveManager": {
   "WaveManager": {
    "wave_number": 0,
    "wave_points": 0,
    "enemies_alive": 0,
    "weak_ranged": {
     "prefab": "Weak_Ranged"
    },
    "medium_ranged": {
     "prefab": "Medium_Ranged"
    },
    "strong_ranged": {
     "prefab": "Strong_Ranged"
    },
    "weak_melee": {
     "prefab": "Weak_Melee"
    },
    "strong_melee": {
     "prefab": "Strong_Melee"
    },
    "cannon": {
     "prefab": "Cannon"
    },
    "weak_ranged_plus": {
     "prefab": "Weak_Ranged+"
    },
    "medium_ranged_plus": {
     "prefab": "Medium_Ranged+"
    },
    "strong_ranged_plus": {
     "prefab": "Strong_Ranged+"
    },
    "weak_melee_plus": {
     "prefab": "Weak_Melee+"
    },
    "strong_melee_plus": {
     "prefab": "Strong_Melee+"
    },
    "cannon_plus": {
     "prefab": "Cannon+"
    },
    "weak_ranged_plus_plus": {
     "prefab": "Weak_Ranged++"
    },
    "medium_ranged_plus_plus": {
     "prefab": "Medium_Ranged++"
    },
    "strong_ranged_plus_plus": {
     "prefab": "Strong_Ranged++"
    },
    "weak_melee_plus_plus": {
     "prefab": "Weak_Melee++"
    },
    "strong_melee_plus_plus": {
     "prefab": "Strong_Melee++"
    },
    "cannon_plus_plus": {
     "prefab": "Cannon++"
    },
    "weak_ranged_end": {
     "prefab": "Weak_Ranged_END"
    },
    "boss_1": {
     "prefab": "Boss1"
    },
    "boss_2": {
     "prefab": "Boss2"
    },
    "debug_countdown2": 60.0
   }
  },
  "ShopManager": {
   "ShopManager": {
    "shop_card": {
     "prefab": "ShopCard"
    },
    "reroll_card": {
     "prefab": "RefreshCards"
    },
    "normal_chance": 65.0,
    "rare_chance": 35.0,
    "epic_chance": 0.0
   }
  },
  "ProgressionManager": {
   "ProgresisonManager": {
    "soul_orbs": 0,
    "atk_lvl": 0,
    "atk_speed_lvl": 0,
    "speed_lvl": 0,
    "armor_lvl": 0,
    "stability_lvl": 0,
    "hp_lvl": 0,
    "soul_orb_lvl": 0,
    "crit_lvl": 0,
    "selected_upgrade": 8,
    "upgrade_price": 0,
    "base_price": 25,
    "lvl_mark": {
     "prefab": "LvlMark"
    }
   }
  },
  "CheatManager": {
   "CheatCodes": {}
  },
  "InputManager": {
   "InputManager": {}
  }
 },
 "input": [
  {
   "action": "Movement",
   "path": "<Gamepad>/leftStick",
   "part": null,
   "composite": false
  },
  {
   "action": "Movement",
   "path": "2DVector",
   "part": null,
   "composite": true
  },
  {
   "action": "Movement",
   "path": "<Keyboard>/w",
   "part": "up",
   "composite": false
  },
  {
   "action": "Movement",
   "path": "<Keyboard>/s",
   "part": "down",
   "composite": false
  },
  {
   "action": "Movement",
   "path": "<Keyboard>/a",
   "part": "left",
   "composite": false
  },
  {
   "action": "Movement",
   "path": "<Keyboard>/d",
   "part": "right",
   "composite": false
  },
  {
   "action": "Jump",
   "path": "<Keyboard>/space",
   "part": null,
   "composite": false
  },
  {
   "action": "Jump",
   "path": "<Gamepad>/leftTrigger",
   "part": null,
   "composite": false
  },
  {
   "action": "Jump",
   "path": "<Keyboard>/w",
   "part": null,
   "composite": false
  },
  {
   "action": "Jump",
   "path": "<Gamepad>/buttonSouth",
   "part": null,
   "composite": false
  },
  {
   "action": "Shoot",
   "path": "<Gamepad>/rightTrigger",
   "part": null,
   "composite": false
  },
  {
   "action": "Shoot",
   "path": "<Mouse>/leftButton",
   "part": null,
   "composite": false
  },
  {
   "action": "AutoAttack",
   "path": "<Keyboard>/q",
   "part": null,
   "composite": false
  },
  {
   "action": "AutoAttack",
   "path": "<Gamepad>/buttonNorth",
   "part": null,
   "composite": false
  },
  {
   "action": "WandDirection",
   "path": "<Gamepad>/rightStick",
   "part": null,
   "composite": false
  },
  {
   "action": "WandDirection",
   "path": "<Mouse>/delta",
   "part": null,
   "composite": false
  },
  {
   "action": "Pause",
   "path": "<Keyboard>/escape",
   "part": null,
   "composite": false
  },
  {
   "action": "Pause",
   "path": "<Gamepad>/start",
   "part": null,
   "composite": false
  },
  {
   "action": "Pause",
   "path": "<Keyboard>/p",
   "part": null,
   "composite": false
  },
  {
   "action": "Back",
   "path": "<Keyboard>/escape",
   "part": null,
   "composite": false
  },
  {
   "action": "Back",
   "path": "<Gamepad>/buttonEast",
   "part": null,
   "composite": false
  }
 ]
};
