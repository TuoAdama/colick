package com.coliclic.backoffice.parcelguidelines;

import java.util.List;

/** Single source of truth for the parcel safety acknowledgement shown before booking. */
public final class ParcelGuidelines {
    public static final String VERSION = "2026-09-01";
    public static final long MAX_PHOTO_BYTES = 5L * 1024L * 1024L;
    public static final List<String> PHOTO_CONTENT_TYPES = List.of("image/jpeg", "image/png", "image/webp");
    public static final List<String> PROHIBITED_ITEMS = List.of(
            "Produits illégaux ou contrefaits",
            "Armes, munitions et objets destinés à blesser",
            "Explosifs, produits inflammables et aérosols dangereux",
            "Stupéfiants et substances interdites",
            "Produits chimiques, toxiques ou autres matières dangereuses",
            "Animaux vivants",
            "Denrées périssables non autorisées par le transporteur",
            "Médicaments soumis à prescription ou autorisation",
            "Tout objet interdit par le transporteur, la compagnie aérienne ou la douane"
    );
    public static final List<String> PACKAGING_RECOMMENDATIONS = List.of(
            "Utilisez un emballage rigide adapté au poids du contenu",
            "Calez les objets et protégez séparément les éléments fragiles",
            "Fermez solidement le colis et protégez tout contenant liquide",
            "Décrivez exactement le contenu au voyageur",
            "Vérifiez les règles du transporteur et des douanes avant l’envoi"
    );

    private ParcelGuidelines() {
    }
}
